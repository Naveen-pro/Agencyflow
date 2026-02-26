"use client";

export default function CampaignsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">📁 All Campaigns</h1>
            <p className="text-sm text-text-muted">View and manage all your marketing campaigns across channels</p>

            {/* Filters */}
            <div className="flex gap-3">
                {["All", "SMS", "WhatsApp", "Email", "Voice"].map((filter) => (
                    <button key={filter} className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === "All"
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-elevated text-text-muted border border-border-bright hover:text-text-primary"
                        }`}>
                        {filter}
                    </button>
                ))}
            </div>

            {/* Campaigns table */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-text-muted text-left">
                            <th className="px-4 py-3 font-medium">Campaign</th>
                            <th className="px-4 py-3 font-medium">Channel</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Sent</th>
                            <th className="px-4 py-3 font-medium">Delivery Rate</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-border/50 hover:bg-elevated/30">
                            <td className="px-4 py-3 font-medium">March Promo Blast</td>
                            <td className="px-4 py-3 text-text-muted">📱 SMS</td>
                            <td className="px-4 py-3"><span className="text-accent-cyan text-xs bg-accent-cyan/10 border border-accent-cyan/30 rounded-full px-2 py-0.5">Completed</span></td>
                            <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">320</td>
                            <td className="px-4 py-3 text-accent-cyan font-medium">99.1%</td>
                            <td className="px-4 py-3 text-text-muted text-xs">2026-02-25</td>
                        </tr>
                        <tr className="hover:bg-elevated/30">
                            <td className="px-4 py-3 font-medium">Product Launch</td>
                            <td className="px-4 py-3 text-text-muted">📧 Email</td>
                            <td className="px-4 py-3"><span className="text-accent text-xs bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">Running</span></td>
                            <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">145/500</td>
                            <td className="px-4 py-3 text-accent-cyan font-medium">97.8%</td>
                            <td className="px-4 py-3 text-text-muted text-xs">2026-02-24</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
