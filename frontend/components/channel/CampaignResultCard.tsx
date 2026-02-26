"use client";

interface Props {
    sent: number;
    failed: number;
    total: number;
    deliveryRate: number;
    duration?: string;
}

export default function CampaignResultCard({ sent, failed, total, deliveryRate, duration }: Props) {
    return (
        <div className="glass-card p-6 mt-4">
            <h3 className="text-lg font-bold font-[family-name:var(--font-syne)] mb-4">📊 Campaign Results</h3>
            <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-accent-cyan">{sent}</p>
                    <p className="text-xs text-text-muted mt-1">Delivered</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-accent-red">{failed}</p>
                    <p className="text-xs text-text-muted mt-1">Failed</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{deliveryRate}%</p>
                    <p className="text-xs text-text-muted mt-1">Delivery Rate</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{duration || "—"}</p>
                    <p className="text-xs text-text-muted mt-1">Duration</p>
                </div>
            </div>
        </div>
    );
}
