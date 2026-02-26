"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores/campaignStore";

interface Props {
    channel: "sms" | "whatsapp" | "email" | "voice";
}

export default function SendAllButton({ channel }: Props) {
    const [isSending, setIsSending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const store = useCampaignStore();

    const canSend = store.uploadId && store.message.trim() && store.status !== "sending";
    const contactCount = store.validCount;

    const channelEmoji: Record<string, string> = {
        sms: "🚀",
        whatsapp: "📨",
        email: "📧",
        voice: "📞",
    };

    const channelLabel: Record<string, string> = {
        sms: "SMS",
        whatsapp: "WhatsApp",
        email: "Email",
        voice: "Call",
    };

    const handleSend = async () => {
        setIsSending(true);
        setShowConfirm(false);
        store.setStatus("sending");

        try {
            let body: any = { upload_id: store.uploadId };

            if (channel === "sms") {
                body.message = store.enhancedMessage || store.message;
            } else if (channel === "whatsapp") {
                body.message = store.enhancedMessage || store.message;
            } else if (channel === "email") {
                body.subject = "Campaign - " + new Date().toLocaleDateString();
                body.body = store.enhancedMessage || store.message;
            } else if (channel === "voice") {
                body.script = store.enhancedMessage || store.message;
            }

            const resp = await apiClient.post(`/campaigns/${channel}`, body);
            store.setCampaignId(resp.data.campaign_id);
        } catch (err: any) {
            alert(err.response?.data?.detail || "Campaign failed to start");
            store.setStatus("composing");
        }

        setIsSending(false);
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={!canSend || isSending}
                className="w-full py-4 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl font-bold text-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
                <span>{channelEmoji[channel]}</span>
                <span>
                    {isSending
                        ? "Sending..."
                        : `Send to All ${contactCount} ${channelLabel[channel]} Contacts`}
                </span>
            </button>

            {/* Confirm dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold font-[family-name:var(--font-syne)]">Confirm Send</h3>
                        <p className="text-sm text-text-muted mt-2">
                            You are about to send <span className="text-text-primary font-semibold">{contactCount}</span>{" "}
                            {channelLabel[channel]} messages. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSend}
                                className="flex-1 py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-lg font-semibold"
                            >
                                Yes, Send All
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-3 border border-border-bright rounded-lg text-text-muted hover:text-text-primary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
