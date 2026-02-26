"use client";
import { useAuthStore } from "@/lib/stores/authStore";

export default function SettingsPage() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">⚙️ Settings</h1>

            {/* Profile */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold font-[family-name:var(--font-syne)]">Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-text-muted mb-1">Name</label>
                        <input
                            defaultValue={user?.displayName || ""}
                            className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-1">Email</label>
                        <input
                            defaultValue={user?.email || ""}
                            disabled
                            className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-2.5 text-sm opacity-60"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-1">Phone</label>
                        <input
                            placeholder="+91 9876543210"
                            className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-muted mb-1">Agency Name</label>
                        <input
                            placeholder="Your Agency Name"
                            className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                        />
                    </div>
                </div>
                <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 transition-all">
                    Save Changes
                </button>
            </div>

            {/* API Keys */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold font-[family-name:var(--font-syne)]">Channel API Keys</h3>
                <p className="text-xs text-text-muted">Configure your Textbee, WAHA, Resend, and Twilio credentials</p>
                {[
                    { label: "Textbee API Key", placeholder: "textbee_..." },
                    { label: "Textbee Device ID", placeholder: "Device ID..." },
                    { label: "Resend API Key", placeholder: "re_..." },
                    { label: "Twilio Account SID", placeholder: "AC..." },
                    { label: "Twilio Auth Token", placeholder: "Token..." },
                ].map((field) => (
                    <div key={field.label}>
                        <label className="block text-sm text-text-muted mb-1">{field.label}</label>
                        <input
                            type="password"
                            placeholder={field.placeholder}
                            className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-2.5 text-sm font-[family-name:var(--font-mono)] focus:border-accent focus:outline-none"
                        />
                    </div>
                ))}
                <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 transition-all">
                    Save API Keys
                </button>
            </div>
        </div>
    );
}
