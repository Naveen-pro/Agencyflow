"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { apiClient } from "@/lib/api";

export default function CampaignsPage() {
    const { agency } = useAuthStore();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!agency) return;

        async function fetchCampaigns() {
            try {
                setLoading(true);
                const channel = filter === "All" ? "" : filter.toLowerCase();
                const resp = await apiClient.get(`/campaigns/${agency.id}/all`, {
                    params: { channel }
                });
                setCampaigns(resp.data.items || []);
            } catch (err) {
                console.error("Failed to fetch campaigns:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCampaigns();
    }, [agency, filter]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">📁 All Campaigns</h1>
            <p className="text-sm text-text-muted">View and manage all your marketing campaigns across channels</p>

            {/* Filters */}
            <div className="flex gap-3">
                {["All", "SMS", "WhatsApp", "Email", "Voice"].map((f) => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === f
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-elevated text-text-muted border border-border-bright hover:text-text-primary"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Campaigns table */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-full py-20 text-text-muted">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-20 text-text-muted italic">No campaigns found for this filter.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-text-muted text-left">
                                <th className="px-4 py-3 font-medium">Campaign</th>
                                <th className="px-4 py-3 font-medium">Channel</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Sent</th>
                                <th className="px-4 py-3 font-medium">Delivery</th>
                                <th className="px-4 py-3 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c) => (
                                <tr key={c.id} className="border-b border-border/50 hover:bg-elevated/30">
                                    <td className="px-4 py-3 font-medium">{c.name}</td>
                                    <td className="px-4 py-3 text-text-muted capitalize">
                                        {c.channel === "sms" ? "📱 SMS" : 
                                         c.channel === "whatsapp" ? "🟢 WA" : 
                                         c.channel === "email" ? "📧 Email" : "📞 Voice"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs border rounded-full px-2 py-0.5 ${
                                            c.status === "completed" ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30" :
                                            c.status === "running" ? "text-accent bg-accent/10 border-accent/30" :
                                            "text-text-muted bg-neutral-500/10 border-neutral-500/30"
                                        }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                                        {c.sent_count}/{c.total_contacts}
                                    </td>
                                    <td className="px-4 py-3 text-accent-cyan font-medium">
                                        {c.total_contacts > 0 ? ((c.delivered_count / c.total_contacts) * 100).toFixed(1) : "0"}%
                                    </td>
                                    <td className="px-4 py-3 text-text-muted text-xs">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
