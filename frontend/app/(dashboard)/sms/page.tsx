"use client";
import CSVUploadZone from "@/components/channel/CSVUploadZone";
import ContactPreviewTable from "@/components/channel/ContactPreviewTable";
import MessageComposer from "@/components/channel/MessageComposer";
import AIEnhanceButton from "@/components/channel/AIEnhanceButton";
import SendAllButton from "@/components/channel/SendAllButton";
import DeliveryStatusFeed from "@/components/channel/DeliveryStatusFeed";
import { useCampaignStore } from "@/lib/stores/campaignStore";
import { useEffect } from "react";

export default function SMSPage() {
    const store = useCampaignStore();

    useEffect(() => {
        store.setChannel("sms");
        return () => store.reset();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">📱 SMS Campaign</h1>
                    <p className="text-sm text-text-muted mt-1">Send bulk SMS to your contacts</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-surface border border-border rounded-lg px-4 py-2">
                        <span className="text-xs text-text-muted">Usage: </span>
                        <span className="text-sm font-[family-name:var(--font-mono)] font-medium">42 / 50</span>
                        <span className="text-xs text-text-muted"> SMS this month</span>
                    </div>
                    <a href="/billing" className="text-xs text-accent hover:underline">Upgrade →</a>
                </div>
            </div>

            {/* Main layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: CSV Upload */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 1 — Upload Contacts</h3>
                    <CSVUploadZone channel="sms" />
                    <ContactPreviewTable />
                </div>

                {/* Right: Message Composer */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 2 — Compose Message</h3>
                    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                        <MessageComposer channel="sms" />
                        <div className="flex items-center gap-3">
                            <AIEnhanceButton channel="sms" />
                        </div>
                    </div>

                    {/* Step 3: Send */}
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 3 — Send</h3>
                    <SendAllButton channel="sms" />
                </div>
            </div>

            {/* Step 4: Live delivery feed */}
            <DeliveryStatusFeed />
        </div>
    );
}
