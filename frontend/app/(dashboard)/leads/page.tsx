"use client";

export default function LeadsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">👥 Leads & Contacts</h1>
            <p className="text-sm text-text-muted">Manage your uploaded contact lists</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface border border-border rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-accent font-[family-name:var(--font-syne)]">1,247</p>
                    <p className="text-sm text-text-muted mt-1">Total Contacts</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-accent-cyan font-[family-name:var(--font-syne)]">6</p>
                    <p className="text-sm text-text-muted mt-1">CSV Uploads</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-accent-amber font-[family-name:var(--font-syne)]">98.2%</p>
                    <p className="text-sm text-text-muted mt-1">Valid Rate</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-4">Recent Uploads</h3>
                <p className="text-sm text-text-muted">Your CSV uploads will appear here.</p>
            </div>
        </div>
    );
}
