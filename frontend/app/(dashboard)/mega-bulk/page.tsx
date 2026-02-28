"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { apiClient } from "@/lib/api";

export default function MegaBulkPage() {
    const { agency } = useAuthStore();
    const [file, setFile] = useState<File | null>(null);
    const [subject, setSubject] = useState("");
    const [html, setHtml] = useState("");
    const [fromName, setFromName] = useState("AgencyFlow");
    const [loading, setLoading] = useState(false);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [progress, setProgress] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const startCampaign = async () => {
        if (!file || !subject || !html) {
            alert("Please fill all fields and select a CSV file.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", subject);
        formData.append("html", html);
        formData.append("from_name", fromName);

        try {
            const emailApiKey = "email_38c7f5321405ae72f23532166abe1444a4ddd842bf95d0125a7d28f76bc1b4a9"; // Hardcoded for now as per proxy setup
            const resp = await fetch("http://localhost:7003/send-mega", {
                method: "POST",
                headers: {
                    "x-api-key": emailApiKey
                },
                body: formData
            });
            const data = await resp.json();
            if (data.started) {
                setCampaignId(data.campaign_id);
                alert("Mega Campaign Started Successfully!");
            }
        } catch (err) {
            console.error("Failed to start mega campaign:", err);
            alert("Error starting campaign. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // SSE Listener for progress
    useEffect(() => {
        if (!campaignId) return;

        const emailApiKey = "email_38c7f5321405ae72f23532166abe1444a4ddd842bf95d0125a7d28f76bc1b4a9";
        const eventSource = new EventSource(`http://localhost:7003/stream/${campaignId}?x-api-key=${emailApiKey}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'delivery') {
                setProgress(data);
            }
            if (data.type === 'complete') {
                setProgress(data);
                eventSource.close();
            }
        };

        return () => eventSource.close();
    }, [campaignId]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-10">
            <div className="space-y-2">
                <h1 className="text-4xl font-black font-[family-name:var(--font-syne)] text-white tracking-tighter">
                    🚀 MEGA BULK EMAIL
                </h1>
                <p className="text-text-muted text-lg">Send 100,000+ emails with zero cost using your own Gmail infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Configuration Card */}
                <div className="bg-surface border border-border rounded-2xl p-8 space-y-6 shadow-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="p-2 bg-accent/10 rounded-lg text-accent">⚙️</span> Campaign Config
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">From Name</label>
                            <input
                                value={fromName}
                                onChange={(e) => setFromName(e.target.value)}
                                className="w-full bg-elevated border border-border-bright rounded-xl px-4 py-3 text-white focus:border-accent transition-all outline-none"
                                placeholder="e.g. AgencyFlow"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Subject Line</label>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-elevated border border-border-bright rounded-xl px-4 py-3 text-white focus:border-accent transition-all outline-none"
                                placeholder="{name}, check this out!"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">HTML Content</label>
                            <textarea
                                value={html}
                                onChange={(e) => setHtml(e.target.value)}
                                className="w-full bg-elevated border border-border-bright rounded-xl px-4 py-3 text-white h-40 focus:border-accent transition-all outline-none"
                                placeholder="<h1>Hi {name}</h1>..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Upload CSV (100k+ limit)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="bg-elevated border-2 border-dashed border-border-bright group-hover:border-accent rounded-xl p-6 text-center transition-all">
                                    <span className="text-3xl mb-2 block">📄</span>
                                    <span className="text-sm font-medium text-text-primary block">
                                        {file ? file.name : "Drop your massive CSV here"}
                                    </span>
                                    <span className="text-xs text-text-muted mt-1 block">Columns needed: email, name, company</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={startCampaign}
                        disabled={loading || !file}
                        className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 ${loading ? "bg-accent/50 cursor-not-allowed" : "bg-gradient-to-r from-accent to-accent-cyan text-black hover:shadow-[0_0_30px_rgba(0,201,177,0.3)]"
                            }`}
                    >
                        {loading ? "PARSING CSV..." : "🚀 BLAST 100,000 EMAILS"}
                    </button>
                </div>

                {/* Progress Card */}
                <div className="bg-surface border border-border rounded-2xl p-8 space-y-6 flex flex-col items-center justify-center text-center">
                    {!campaignId ? (
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-4xl mx-auto animate-pulse">
                                📊
                            </div>
                            <p className="text-text-muted">Once you start the campaign, live progress will appear here.</p>
                        </div>
                    ) : (
                        <div className="w-full space-y-8">
                            <h2 className="text-2xl font-black text-white italic">CAMPAIGN IN PROGRESS</h2>

                            <div className="relative w-48 h-48 mx-auto">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1E2433" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#00C9B1" strokeWidth="8"
                                        strokeDasharray={`${(progress?.sent / progress?.total) * 283 || 0} 283`}
                                        strokeLinecap="round" transform="rotate(-90 50 50)"
                                        className="transition-all duration-500 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-white">
                                        {Math.round((progress?.sent / progress?.total) * 100) || 0}%
                                    </span>
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Delivered</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-elevated p-4 rounded-xl border border-border-bright">
                                    <span className="block text-[10px] font-black text-text-muted uppercase tracking-tighter">Sent</span>
                                    <span className="text-2xl font-black text-white">{progress?.sent || 0}</span>
                                </div>
                                <div className="bg-elevated p-4 rounded-xl border border-border-bright">
                                    <span className="block text-[10px] font-black text-text-muted uppercase tracking-tighter">Remaining</span>
                                    <span className="text-2xl font-black text-white">{(progress?.total || 0) - (progress?.sent || 0)}</span>
                                </div>
                            </div>

                            {progress?.type === 'complete' && (
                                <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl text-accent font-bold animate-bounce">
                                    🎉 CAMPAIGN COMPLETED!
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-text-muted uppercase italic">
                                    <span>Last Delivery</span>
                                    <span>{progress?.email || 'N/A'}</span>
                                </div>
                                <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-300"
                                        style={{ width: `${(progress?.sent / progress?.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
