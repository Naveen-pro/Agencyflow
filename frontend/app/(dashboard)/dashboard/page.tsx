"use client";
import { useAuthStore } from "@/lib/stores/authStore";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export default function DashboardPage() {
    const { user, agency, usage } = useAuthStore();
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!agency) return;
        async function fetchRecent() {
            try {
                const resp = await apiClient.get(`/campaigns/${agency.id}/all`, {
                    params: { per_page: 5 }
                });
                setRecentCampaigns(resp.data.items || []);
            } catch (err) {
                console.error("Failed to fetch recent campaigns:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRecent();
    }, [agency]);

    const KPI_CARDS = [
        { label: "Total Campaigns", value: usage?.total_campaigns || "—", change: "", icon: "📁", color: "from-accent to-accent-cyan" },
        { label: "Messages Sent", value: ((usage?.sms_used || 0) + (usage?.wa_used || 0) + (usage?.email_used || 0)).toLocaleString(), change: "", icon: "📨", color: "from-purple-500 to-accent" },
        { label: "Delivery Rate", value: "98.4%", change: "", icon: "✅", color: "from-accent-cyan to-emerald-500" },
        { label: "AI Enhancements", value: usage?.ai_calls_used || "0", change: `${usage ? usage.ai_calls_limit - usage.ai_calls_used : 0} left`, icon: "✨", color: "from-accent-amber to-orange-500" },
    ];

    const usageItems = [
        { label: "SMS", used: usage?.sms_used || 0, limit: usage?.sms_limit || 0 },
        { label: "WhatsApp", used: usage?.wa_used || 0, limit: usage?.wa_limit || 0 },
        { label: "Email", used: usage?.email_used || 0, limit: usage?.email_limit || 0 },
        { label: "Voice", used: usage?.voice_used || 0, limit: usage?.voice_limit || 0 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">Dashboard</h1>
                <p className="text-sm text-text-muted mt-1">
                    {user?.displayName ? `Hello, ${user.displayName}. ` : ""}Overview of your marketing campaigns
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {KPI_CARDS.map((kpi) => (
                    <div key={kpi.label} className="bg-surface border border-border rounded-xl p-5 hover:border-border-bright transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{kpi.icon}</span>
                            {kpi.change && (
                                <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${kpi.color} text-white font-medium`}>
                                    {kpi.change}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold font-[family-name:var(--font-syne)]">{kpi.value}</p>
                        <p className="text-xs text-text-muted mt-1">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Usage Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-4">Usage This Month</h3>
                    <div className="space-y-4">
                        {usageItems.map((item) => {
                            const pct = item.limit > 0 ? (item.used / item.limit) * 100 : 0;
                            return (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-muted">{item.label}</span>
                                        <span className="font-[family-name:var(--font-mono)] text-xs">{item.used} / {item.limit}</span>
                                    </div>
                                    <div className="h-2 bg-elevated rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${pct >= 90 ? "from-accent-red to-orange-500"
                                                    : pct >= 70 ? "from-accent-amber to-orange-500"
                                                        : "from-accent to-accent-cyan"
                                                } transition-all`}
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Campaigns */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold font-[family-name:var(--font-syne)]">Recent Campaigns</h3>
                        <a href="/campaigns" className="text-xs text-accent hover:underline">View all</a>
                    </div>
                    {loading ? (
                        <div className="py-10 text-center text-text-muted">Loading...</div>
                    ) : recentCampaigns.length === 0 ? (
                        <div className="py-10 text-center text-text-muted italic text-sm">No campaigns yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {recentCampaigns.map((c, i) => (
                                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium">{c.name}</p>
                                        <p className="text-xs text-text-muted uppercase">{c.channel}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${c.status === "completed" ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30"
                                                : c.status === "running" ? "text-accent bg-accent/10 border-accent/30"
                                                    : "text-accent-amber bg-accent-amber/10 border-accent-amber/30"
                                            }`}>
                                            {c.status}
                                        </span>
                                        <p className="text-xs text-text-muted mt-1">
                                            {c.sent_count} sent · {c.total_contacts > 0 ? ((c.delivered_count / c.total_contacts) * 100).toFixed(1) : 0}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
