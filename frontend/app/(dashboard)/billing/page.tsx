"use client";

const PLANS = [
    {
        name: "Free Trial",
        price: "₹0",
        period: "14 days",
        limits: { sms: 50, whatsapp: 20, email: 50, voice: 10, ai: 20 },
        features: ["50 SMS", "20 WhatsApp", "50 Emails", "10 Voice Calls", "20 AI Calls"],
        current: true,
    },
    {
        name: "Pro",
        price: "₹2,999",
        period: "/month",
        limits: { sms: 5000, whatsapp: 2000, email: 10000, voice: 500, ai: 500 },
        features: ["5,000 SMS", "2,000 WhatsApp", "10,000 Emails", "500 Voice Calls", "500 AI Calls", "Priority Support"],
        recommended: true,
    },
    {
        name: "Agency",
        price: "₹9,999",
        period: "/month",
        limits: { sms: 999999, whatsapp: 999999, email: 999999, voice: 999999, ai: 999999 },
        features: ["Unlimited SMS", "Unlimited WhatsApp", "Unlimited Emails", "Unlimited Voice", "Unlimited AI", "White Label", "Dedicated Account Manager"],
    },
];

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">💳 Billing & Plans</h1>
            <p className="text-sm text-text-muted">Choose the plan that fits your agency</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                    <div
                        key={plan.name}
                        className={`bg-surface border rounded-2xl p-6 relative ${plan.recommended
                                ? "border-accent bg-accent/5"
                                : plan.current
                                    ? "border-accent-cyan"
                                    : "border-border"
                            }`}
                    >
                        {plan.recommended && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-xs rounded-full font-medium">
                                Recommended
                            </span>
                        )}
                        {plan.current && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent-cyan text-black text-xs rounded-full font-medium">
                                Current Plan
                            </span>
                        )}

                        <h3 className="text-xl font-bold font-[family-name:var(--font-syne)] mt-1">{plan.name}</h3>
                        <div className="mt-2">
                            <span className="text-3xl font-bold font-[family-name:var(--font-syne)]">{plan.price}</span>
                            <span className="text-sm text-text-muted">{plan.period}</span>
                        </div>

                        <ul className="mt-6 space-y-2">
                            {plan.features.map((f) => (
                                <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                                    <span className="text-accent-cyan">✓</span>
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            className={`w-full mt-6 py-3 rounded-xl font-semibold text-sm transition-all ${plan.current
                                    ? "bg-elevated text-text-muted cursor-default"
                                    : plan.recommended
                                        ? "bg-gradient-to-r from-accent to-accent-cyan text-white hover:-translate-y-0.5"
                                        : "border border-border-bright text-text-muted hover:text-text-primary hover:border-accent/50"
                                }`}
                        >
                            {plan.current ? "Current Plan" : `Upgrade to ${plan.name}`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
