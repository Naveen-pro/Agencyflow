"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores/campaignStore";

interface Props {
    channel: "sms" | "whatsapp" | "email" | "voice";
}

const TONES = [
    { key: "professional", label: "Professional", desc: "Formal, data-driven" },
    { key: "casual", label: "Casual", desc: "Warm, conversational" },
    { key: "urgent", label: "Urgent", desc: "Time-sensitive, FOMO" },
    { key: "friendly", label: "Friendly", desc: "Approachable, genuine" },
];

export default function AIEnhanceButton({ channel }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [selectedTone, setSelectedTone] = useState("professional");
    const [comparison, setComparison] = useState<{ original: string; enhanced: string } | null>(null);
    const store = useCampaignStore();

    const handleEnhance = async () => {
        if (!store.message.trim()) return;
        setIsEnhancing(true);

        try {
            const resp = await apiClient.post("/ai/enhance", {
                text: store.message,
                channel,
                tone: selectedTone,
            });

            setComparison({
                original: store.message,
                enhanced: resp.data.enhanced_text,
            });
        } catch (err: any) {
            alert(err.response?.data?.detail || "Enhancement failed");
        }

        setIsEnhancing(false);
    };

    const useEnhanced = () => {
        if (comparison) {
            store.setEnhancedMessage(comparison.enhanced);
            store.setMessage(comparison.enhanced);
        }
        setComparison(null);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={!store.message.trim() || !store.uploadId}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-accent text-white rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
                <span>✨</span>
                <span>Enhance with AI</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-xl font-bold font-[family-name:var(--font-syne)]">
                                ✨ AI Enhancement
                            </h3>
                            <p className="text-sm text-text-muted mt-1">Choose a tone and let AI rewrite your message</p>
                        </div>

                        {!comparison ? (
                            <div className="p-6 space-y-6">
                                {/* Tone selector */}
                                <div className="grid grid-cols-2 gap-3">
                                    {TONES.map((tone) => (
                                        <button
                                            key={tone.key}
                                            onClick={() => setSelectedTone(tone.key)}
                                            className={`p-3 rounded-xl border text-left transition-all ${selectedTone === tone.key
                                                    ? "border-accent bg-accent/10"
                                                    : "border-border-bright hover:border-accent/50"
                                                }`}
                                        >
                                            <p className="font-medium text-sm">{tone.label}</p>
                                            <p className="text-xs text-text-muted mt-0.5">{tone.desc}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleEnhance}
                                        disabled={isEnhancing}
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-accent text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                                    >
                                        {isEnhancing ? "🤖 Enhancing..." : "Enhance Now →"}
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-3 border border-border-bright rounded-lg text-text-muted hover:text-text-primary transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {/* Comparison */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-text-muted mb-2">Original</h4>
                                        <div className="bg-elevated border border-border rounded-lg p-4 text-sm font-[family-name:var(--font-mono)]">
                                            {comparison.original}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium bg-gradient-to-r from-purple-400 to-accent text-transparent bg-clip-text mb-2">
                                            ✨ Enhanced
                                        </h4>
                                        <div className="bg-elevated border border-accent/20 rounded-lg p-4 text-sm font-[family-name:var(--font-mono)]">
                                            {comparison.enhanced}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={useEnhanced}
                                        className="flex-1 py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-lg font-semibold"
                                    >
                                        ✓ Use Enhanced
                                    </button>
                                    <button
                                        onClick={() => { setComparison(null); setIsOpen(false); }}
                                        className="flex-1 py-3 border border-border-bright rounded-lg text-text-muted hover:text-text-primary"
                                    >
                                        ✗ Keep Original
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
