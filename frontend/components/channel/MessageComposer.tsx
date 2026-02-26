"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores/campaignStore";

interface Props {
    channel: "sms" | "whatsapp" | "email" | "voice";
}

const CHAR_LIMITS: Record<string, number | null> = {
    sms: 160,
    whatsapp: null,
    email: null,
    voice: null,
};

export default function MessageComposer({ channel }: Props) {
    const store = useCampaignStore();
    const charLimit = CHAR_LIMITS[channel];

    const charCount = store.message.length;
    const isOverLimit = charLimit ? charCount > charLimit : false;
    const isNearLimit = charLimit ? charCount > charLimit * 0.875 : false;

    const insertVariable = (variable: string) => {
        store.setMessage(store.message + `{${variable}}`);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary">
                {channel === "voice" ? "Voice Script" : "Message Content"}
            </label>

            <div className="relative">
                <textarea
                    value={store.enhancedMessage || store.message}
                    onChange={(e) => {
                        store.setMessage(e.target.value);
                        store.setEnhancedMessage(null);
                    }}
                    rows={channel === "voice" ? 6 : 4}
                    placeholder={
                        channel === "sms"
                            ? "Type your SMS message..."
                            : channel === "whatsapp"
                                ? "Type your WhatsApp message..."
                                : channel === "email"
                                    ? "Compose your email body..."
                                    : "Write what the AI voice will say..."
                    }
                    className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-text-primary placeholder-text-muted font-[family-name:var(--font-mono)] text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all resize-none"
                    disabled={!store.uploadId}
                />

                {store.enhancedMessage && (
                    <span className="absolute top-2 right-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">
                        ✨ AI Enhanced
                    </span>
                )}
            </div>

            {/* Character / word counter */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {["name", "company", "link"].map((v) => (
                        <button
                            key={v}
                            onClick={() => insertVariable(v)}
                            className="text-xs px-2 py-1 rounded border border-border-bright text-text-muted hover:text-accent hover:border-accent/50 transition-colors"
                        >
                            {`{${v}}`}
                        </button>
                    ))}
                </div>

                {charLimit && (
                    <span className={`text-xs font-[family-name:var(--font-mono)] ${isOverLimit ? "text-accent-red" : isNearLimit ? "text-accent-amber" : "text-text-muted"
                        }`}>
                        {charCount} / {charLimit}
                    </span>
                )}

                {channel === "voice" && (
                    <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">
                        {store.message.split(/\s+/).filter(Boolean).length} / 75 words
                    </span>
                )}
            </div>
        </div>
    );
}
