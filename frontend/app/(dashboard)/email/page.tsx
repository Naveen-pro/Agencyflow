"use client";
import CSVUploadZone from "@/components/channel/CSVUploadZone";
import ContactPreviewTable from "@/components/channel/ContactPreviewTable";
import MessageComposer from "@/components/channel/MessageComposer";
import AIEnhanceButton from "@/components/channel/AIEnhanceButton";
import SendAllButton from "@/components/channel/SendAllButton";
import DeliveryStatusFeed from "@/components/channel/DeliveryStatusFeed";
import { useCampaignStore } from "@/lib/stores/campaignStore";
import { useEffect, useState } from "react";

export default function EmailPage() {
    const store = useCampaignStore();
    const [subject, setSubject] = useState("");

    useEffect(() => {
        store.setChannel("email");
        return () => store.reset();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">📧 Email Campaign</h1>
                    <p className="text-sm text-text-muted mt-1">Send bulk emails via Resend</p>
                </div>
                <div className="bg-surface border border-border rounded-lg px-4 py-2">
                    <span className="text-xs text-text-muted">Usage: </span>
                    <span className="text-sm font-[family-name:var(--font-mono)] font-medium">35 / 50</span>
                    <span className="text-xs text-text-muted"> emails this month</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 1 — Upload Contacts</h3>
                    <CSVUploadZone channel="email" />
                    <ContactPreviewTable />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 2 — Compose Email</h3>
                    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                        {/* Subject line */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Subject Line</label>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter email subject..."
                                className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-2.5 text-text-primary placeholder-text-muted text-sm focus:border-accent focus:outline-none"
                            />
                        </div>

                        {/* From name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">From Name</label>
                            <input
                                defaultValue="Your Agency"
                                className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-2.5 text-text-primary text-sm focus:border-accent focus:outline-none"
                            />
                        </div>

                        <MessageComposer channel="email" />
                        <div className="flex items-center gap-3">
                            <AIEnhanceButton channel="email" />
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-border-bright text-text-muted rounded-lg text-sm hover:text-text-primary transition-all">
                                📧 Send Test to Me
                            </button>
                        </div>
                    </div>
                    <SendAllButton channel="email" />
                </div>
            </div>

            <DeliveryStatusFeed />
        </div>
    );
}
