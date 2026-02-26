"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/sms", icon: "📱", label: "SMS" },
    { href: "/whatsapp", icon: "💬", label: "WhatsApp" },
    { href: "/email", icon: "📧", label: "Email" },
    { href: "/voice", icon: "📞", label: "Voice Calls" },
    { href: "/campaigns", icon: "📁", label: "Campaigns" },
    { href: "/leads", icon: "👥", label: "Leads" },
    { href: "/blog", icon: "📰", label: "Blog" },
    { href: "/ai-status", icon: "🤖", label: "AI Status" },
    { href: "/billing", icon: "💳", label: "Billing" },
    { href: "/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center text-white font-bold text-sm font-[family-name:var(--font-syne)]">
                        AF
                    </div>
                    <span className="text-lg font-bold font-[family-name:var(--font-syne)] tracking-tight">
                        AgencyFlow
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
                                    ? "bg-accent/10 text-accent border border-accent/20"
                                    : "text-text-muted hover:text-text-primary hover:bg-elevated"
                                }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <div className="glass-card p-3">
                    <p className="text-xs text-text-muted">Free Trial</p>
                    <p className="text-xs text-accent-amber font-medium mt-1">14 days remaining</p>
                    <Link
                        href="/billing"
                        className="mt-2 block text-center text-xs py-1.5 rounded-md bg-gradient-to-r from-accent to-accent-cyan text-white font-semibold hover:-translate-y-0.5 transition-transform"
                    >
                        Upgrade Plan
                    </Link>
                </div>
            </div>
        </aside>
    );
}
