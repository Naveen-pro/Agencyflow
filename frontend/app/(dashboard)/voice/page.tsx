"use client";
import CSVUploadZone from "@/components/channel/CSVUploadZone";
import ContactPreviewTable from "@/components/channel/ContactPreviewTable";
import MessageComposer from "@/components/channel/MessageComposer";
import AIEnhanceButton from "@/components/channel/AIEnhanceButton";
import SendAllButton from "@/components/channel/SendAllButton";
import DeliveryStatusFeed from "@/components/channel/DeliveryStatusFeed";
import { useCampaignStore } from "@/lib/stores/campaignStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useEffect } from "react";

export default function VoicePage() {
    const store = useCampaignStore();
    const { usage } = useAuthStore();

    useEffect(() => {
        store.setChannel("voice");
        return () => store.reset();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">📞 Voice Campaign</h1>
                    <p className="text-sm text-text-muted mt-1">Automated voice calls via Twilio</p>
                </div>
                <div className="bg-surface border border-border rounded-lg px-4 py-2">
                    <span className="text-xs text-text-muted">Usage: </span>
                    <span className="text-sm font-[family-name:var(--font-mono)] font-medium">
                        {usage?.voice_used ?? 0} / {usage?.voice_limit ?? 0}
                    </span>
                    <span className="text-xs text-text-muted"> calls this month</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 1 — Upload Contacts</h3>
                    <CSVUploadZone channel="voice" />
                    <ContactPreviewTable />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Step 2 — Voice Script</h3>
                    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                        {/* Voice selector */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-2">Voice</label>
                                <select 
                                    value={store.voice}
                                    onChange={(e) => store.setVoice(e.target.value)}
                                    className="w-full bg-elevated border border-border-bright rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                                >
                                    <option value="female-en">Female - English</option>
                                    <option value="male-en">Male - English</option>
                                    <option value="female-hi">Female - Hindi</option>
                                    <option value="male-hi">Male - Hindi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Speed</label>
                                <select 
                                    value={store.speed}
                                    onChange={(e) => store.setSpeed(e.target.value)}
                                    className="w-full bg-elevated border border-border-bright rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                                >
                                    <option value="slow">Slow</option>
                                    <option value="normal">Normal</option>
                                    <option value="fast">Fast</option>
                                </select>
                            </div>
                        </div>

                        <MessageComposer channel="voice" />

                        <div className="flex items-center gap-3">
                            <AIEnhanceButton channel="voice" />
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-border-bright text-text-muted rounded-lg text-sm hover:text-text-primary transition-all">
                                ▶ Preview Voice
                            </button>
                        </div>
                    </div>
                    <SendAllButton channel="voice" />
                </div>
            </div>

            <DeliveryStatusFeed />
        </div>
    );
}
