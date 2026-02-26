"use client";
import { useEffect, useState } from "react";
import { useCampaignStore } from "@/lib/stores/campaignStore";
import { auth } from "@/lib/firebase/client";

interface DeliveryEvent {
    type: string;
    contact_name?: string;
    contact_value?: string;
    status?: string;
    error?: string;
    timestamp?: string;
    stats?: { sent: number; failed: number; total: number };
}

export default function DeliveryStatusFeed() {
    const [events, setEvents] = useState<DeliveryEvent[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const store = useCampaignStore();
    const sentCount = events.filter((e) => e.status === "delivered").length;
    const failCount = events.filter((e) => e.status === "failed").length;

    useEffect(() => {
        if (!store.campaignId) return;

        const connectSSE = async () => {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const es = new EventSource(
                `${API_URL}/api/v1/campaigns/${store.campaignId}/stream?token=${token}`
            );

            es.onmessage = (event) => {
                const data: DeliveryEvent = JSON.parse(event.data);
                if (data.type === "complete") {
                    setIsComplete(true);
                    store.setStatus("completed");
                    es.close();
                } else {
                    setEvents((prev) => [...prev, data]);
                }
            };

            es.onerror = () => {
                es.close();
            };

            return () => es.close();
        };

        connectSSE();
    }, [store.campaignId]);

    if (!store.campaignId) return null;

    return (
        <div className="bg-base border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`${isComplete ? "" : "pulse-dot"}`}>
                        {isComplete ? "✅" : "📡"}
                    </span>
                    <span className="text-sm font-medium font-[family-name:var(--font-mono)]">
                        {isComplete ? "Campaign Complete" : "Sending..."}
                    </span>
                </div>
                <span className="text-xs font-[family-name:var(--font-mono)] text-text-muted">
                    {sentCount} delivered · {failCount} failed
                </span>
            </div>

            {/* Log entries */}
            <div className="max-h-64 overflow-y-auto p-3 space-y-1">
                {events.map((event, i) => (
                    <div
                        key={i}
                        className="font-[family-name:var(--font-mono)] text-xs flex items-center gap-3 py-1 px-2 rounded hover:bg-elevated/50"
                    >
                        <span className={event.status === "delivered" ? "text-accent-cyan" : "text-accent-red"}>
                            {event.status === "delivered" ? "✅" : "❌"}
                        </span>
                        <span className="text-text-primary">{event.contact_name}</span>
                        <span className="text-text-muted">({event.contact_value})</span>
                        <span className="text-text-muted">·</span>
                        <span className={event.status === "delivered" ? "text-accent-cyan" : "text-accent-red"}>
                            {event.status === "delivered" ? "Delivered" : `Failed: ${event.error || "Unknown"}`}
                        </span>
                    </div>
                ))}

                {events.length === 0 && (
                    <p className="text-xs text-text-muted text-center py-4">Waiting for delivery events...</p>
                )}
            </div>
        </div>
    );
}
