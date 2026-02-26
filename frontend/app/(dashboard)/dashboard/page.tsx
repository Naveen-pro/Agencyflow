"use client";

const KPI_CARDS = [
    { label: "Total Campaigns", value: "24", change: "+3 this week", icon: "📁", color: "from-accent to-accent-cyan" },
    { label: "Messages Sent", value: "1,247", change: "+186 today", icon: "📨", color: "from-purple-500 to-accent" },
    { label: "Delivery Rate", value: "98.4%", change: "+0.2%", icon: "✅", color: "from-accent-cyan to-emerald-500" },
    { label: "AI Enhancements", value: "42", change: "8 remaining", icon: "✨", color: "from-accent-amber to-orange-500" },
];

const RECENT_CAMPAIGNS = [
    { name: "March Promo SMS", channel: "📱 SMS", status: "Completed", sent: 320, rate: "99.1%" },
    { name: "WhatsApp Launch", channel: "💬 WA", status: "Running", sent: 145, rate: "97.8%" },
    { name: "Newsletter #12", channel: "📧 Email", status: "Completed", sent: 1050, rate: "98.5%" },
    { name: "Offer Reminder", channel: "📞 Voice", status: "Queued", sent: 0, rate: "—" },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">Dashboard</h1>
                <p className="text-sm text-text-muted mt-1">Overview of your marketing campaigns</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {KPI_CARDS.map((kpi) => (
                    <div key={kpi.label} className="bg-surface border border-border rounded-xl p-5 hover:border-border-bright transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{kpi.icon}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${kpi.color} text-white font-medium`}>
                                {kpi.change}
                            </span>
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
                        {[
                            { label: "SMS", used: 42, limit: 50 },
                            { label: "WhatsApp", used: 12, limit: 20 },
                            { label: "Email", used: 35, limit: 50 },
                            { label: "Voice", used: 3, limit: 10 },
                        ].map((item) => {
                            const pct = (item.used / item.limit) * 100;
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
                    <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-4">Recent Campaigns</h3>
                    <div className="space-y-3">
                        {RECENT_CAMPAIGNS.map((c, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                <div>
                                    <p className="text-sm font-medium">{c.name}</p>
                                    <p className="text-xs text-text-muted">{c.channel}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${c.status === "Completed" ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30"
                                            : c.status === "Running" ? "text-accent bg-accent/10 border-accent/30"
                                                : "text-accent-amber bg-accent-amber/10 border-accent-amber/30"
                                        }`}>
                                        {c.status}
                                    </span>
                                    <p className="text-xs text-text-muted mt-1">{c.sent} sent · {c.rate}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
