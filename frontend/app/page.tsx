"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base">
      {/* Nav */}
      <nav className="border-b border-border bg-surface/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center text-white font-bold text-sm">
              AF
            </div>
            <span className="text-xl font-bold font-[family-name:var(--font-syne)] tracking-tight">AgencyFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-text-muted hover:text-text-primary transition-colors">Pricing</a>
            <Link href="/login" className="text-sm text-text-muted hover:text-text-primary transition-colors">Login</Link>
            <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 transition-all">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-sm mb-8">
          <span className="pulse-dot w-2 h-2 rounded-full bg-accent-cyan inline-block" />
          Built for Indian marketing agencies
        </div>
        <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-syne)] tracking-tighter leading-tight max-w-4xl mx-auto">
          Multi-Channel Marketing
          <span className="bg-gradient-to-r from-accent via-purple-400 to-accent-cyan text-transparent bg-clip-text"> Automation</span>
        </h1>
        <p className="text-xl text-text-muted mt-6 max-w-2xl mx-auto leading-relaxed">
          SMS, WhatsApp, Email, and Voice campaigns — all from one dashboard.
          AI-enhanced messages, real-time delivery tracking, and usage-based billing.
        </p>
        <div className="flex items-center gap-4 justify-center mt-10">
          <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl text-lg font-bold hover:-translate-y-1 transition-all shadow-lg shadow-accent/25">
            Start 14-Day Free Trial →
          </Link>
          <a href="#features" className="px-8 py-4 border border-border-bright rounded-xl text-lg text-text-muted hover:text-text-primary hover:border-accent/50 transition-all">
            See Features
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold font-[family-name:var(--font-syne)] text-center mb-12">Everything You Need</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "📱", title: "Bulk SMS", desc: "Textbee integration with auto phone validation" },
            { icon: "💬", title: "WhatsApp", desc: "WAHA self-hosted WhatsApp API" },
            { icon: "📧", title: "Email", desc: "Resend API with HTML templates" },
            { icon: "📞", title: "Voice Calls", desc: "Twilio TTS with multi-language support" },
            { icon: "✨", title: "AI Enhancement", desc: "7 AI providers with automatic fallback" },
            { icon: "📊", title: "Live Tracking", desc: "Real-time SSE delivery status" },
            { icon: "📰", title: "Blog Engine", desc: "RSS-to-campaign content automation" },
            { icon: "💳", title: "Razorpay", desc: "INR billing with subscription plans" },
          ].map((f) => (
            <div key={f.title} className="bg-surface border border-border rounded-xl p-6 hover:border-border-bright hover:-translate-y-1 transition-all">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="font-semibold font-[family-name:var(--font-syne)]">{f.title}</h3>
              <p className="text-sm text-text-muted mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold font-[family-name:var(--font-syne)] text-center mb-12">Simple Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: "Free Trial", price: "₹0", period: "14 days", features: ["50 SMS", "20 WhatsApp", "50 Emails", "10 Voice Calls"] },
            { name: "Pro", price: "₹2,999", period: "/month", features: ["5,000 SMS", "2,000 WhatsApp", "10,000 Emails", "500 Voice Calls"], popular: true },
            { name: "Agency", price: "₹9,999", period: "/month", features: ["Unlimited Everything", "White Label", "Priority Support", "Dedicated Manager"] },
          ].map((plan) => (
            <div key={plan.name} className={`bg-surface border rounded-2xl p-6 text-center ${plan.popular ? "border-accent scale-105" : "border-border"}`}>
              {plan.popular && <p className="text-xs text-accent font-semibold mb-2">Most Popular</p>}
              <h3 className="text-xl font-bold font-[family-name:var(--font-syne)]">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2 font-[family-name:var(--font-syne)]">{plan.price}<span className="text-sm text-text-muted font-normal">{plan.period}</span></p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                {plan.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <Link href="/register" className="mt-6 block py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl font-semibold text-sm hover:-translate-y-0.5 transition-all">
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 text-center">
        <p className="text-sm text-text-muted">© 2026 AgencyFlow. Built with ❤️ for Indian marketing agencies.</p>
      </footer>
    </div>
  );
}
