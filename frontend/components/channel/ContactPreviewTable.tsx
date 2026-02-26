"use client";
import { useCampaignStore } from "@/lib/stores/campaignStore";

export default function ContactPreviewTable() {
    const { contacts, validCount, invalidCount } = useCampaignStore();
    const preview = contacts.slice(0, 10);

    if (preview.length === 0) return null;

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium">Contact Preview</span>
                <span className="text-xs text-text-muted">
                    Showing {preview.length} of {validCount + invalidCount}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-text-muted text-left">
                            <th className="px-4 py-2 font-medium">Name</th>
                            <th className="px-4 py-2 font-medium">Contact</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preview.map((contact, i) => (
                            <tr key={i} className="border-b border-border/50 hover:bg-elevated/30">
                                <td className="px-4 py-2">{contact.name || "—"}</td>
                                <td className="px-4 py-2 font-[family-name:var(--font-mono)] text-xs">
                                    {contact.phone || contact.email || "—"}
                                </td>
                                <td className="px-4 py-2">
                                    <span className="text-xs text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/30 rounded-full px-2 py-0.5">
                                        Valid ✅
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
