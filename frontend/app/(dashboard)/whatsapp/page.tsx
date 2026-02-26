"use client";
import CSVUploadZone from "@/components/channel/CSVUploadZone";
import ContactPreviewTable from "@/components/channel/ContactPreviewTable";
import MessageComposer from "@/components/channel/MessageComposer";
import AIEnhanceButton from "@/components/channel/AIEnhanceButton";
import SendAllButton from "@/components/channel/SendAllButton";
import DeliveryStatusFeed from "@/components/channel/DeliveryStatusFeed";
import { useCampaignStore } from "@/lib/stores/campaignStore";
import { useEffect } from "react";

export default function WhatsAppPage() {
    const store = useCampaignStore();

    useEffect(() => {
        store.setChannel("whatsapp");
        return () => store.reset();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">💬 WhatsApp Campaign</h1>
                    <p className="text-sm text-text-muted mt-1">Send bulk WhatsApp messages</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-surface border border-border rounded-lg px-4 py-2">
                        <span className="text-xs text-text-muted">Usage: </span>
                        <span className="text-sm font-[family-name:var(--font-mono)] font-medium">12 / 20</span>
                        <span className="text-xs text-text-muted"> WA this month</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 1 — Upload Contacts</h3>
                    <CSVUploadZone channel="whatsapp" />
                    <ContactPreviewTable />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 2 — Compose Message</h3>
                    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                        <MessageComposer channel="whatsapp" />
                        <div className="flex items-center gap-3">
                            <AIEnhanceButton channel="whatsapp" />
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-border-bright text-text-muted rounded-lg text-sm hover:text-text-primary hover:border-accent/50 transition-all">
                                🌪️ Deep Research
                            </button>
                        </div>
                    </div>
                    <SendAllButton channel="whatsapp" />
                </div>
            </div>

            <DeliveryStatusFeed />
        </div>
    );
}
