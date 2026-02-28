"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";

export default function AIStatusPage() {
    const { usage } = useAuthStore();
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const resp = await apiClient.get("/ai/provider-status");
                // Transform backend map to array
                const data = Object.entries(resp.data).map(([name, status]: [string, any]) => ({
                    name,
                    status: status.status === "online" ? "online" : "offline",
                    model: status.model || "Default",
                    usage: status.usage || "Marketing Content",
                    speed: status.latency || "~300ms"
                }));
                setProviders(data);
            } catch (err) {
                console.error("Failed to fetch AI status:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">🤖 AI Provider Status</h1>
            <p className="text-sm text-text-muted">Monitor your AI providers and their current availability</p>

            {loading ? (
                <div className="text-sm text-text-muted italic">Checking provider status...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {providers.map((provider) => (
                        <div key={provider.name} className="bg-surface border border-border rounded-xl p-5 hover:border-border-bright transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold font-[family-name:var(--font-syne)] capitalize">{provider.name}</h3>
                                <span className={`flex items-center gap-1.5 text-xs ${provider.status === "online" ? "text-accent-cyan" : "text-accent-red"
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${provider.status === "online" ? "bg-accent-cyan pulse-dot" : "bg-accent-red"
                                        }`} />
                                    {provider.status}
                                </span>
                            </div>
                            <p className="text-xs font-[family-name:var(--font-mono)] text-text-muted mb-2">{provider.model}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-muted">{provider.usage}</span>
                                <span className="text-xs font-[family-name:var(--font-mono)] text-accent">{provider.speed}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-3">AI Usage This Month</h3>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-accent to-accent-cyan rounded-full transition-all" 
                            style={{ width: `${usage ? (usage.ai_calls_used / usage.ai_calls_limit) * 100 : 0}%` }}
                        />
                    </div>
                    <span className="text-sm font-[family-name:var(--font-mono)]">
                        {usage?.ai_calls_used || 0} / {usage?.ai_calls_limit || 100}
                    </span>
                </div>
            </div>
        </div>
    );
}
