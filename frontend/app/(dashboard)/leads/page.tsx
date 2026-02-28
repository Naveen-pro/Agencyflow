"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { apiClient } from "@/lib/api";

export default function LeadsPage() {
    const { agency } = useAuthStore();
    const [uploads, setUploads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!agency) return;
        async function fetchUploads() {
            try {
                setLoading(true);
                const resp = await apiClient.get(`/csv/list/${agency.id}`);
                setUploads(resp.data.items || []);
            } catch (err) {
                console.error("Failed to fetch uploads:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUploads();
    }, [agency]);

    const totalContacts = uploads.reduce((acc, curr) => acc + (curr.total_contacts || 0), 0);
    const validRate = uploads.length > 0 
        ? ((uploads.reduce((acc, curr) => acc + (curr.valid_contacts || 0), 0) / totalContacts) * 100).toFixed(1) 
        : "0";

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">👥 Leads & Contacts</h1>
            <p className="text-sm text-text-muted">Manage your uploaded contact lists</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface border border-border rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-accent font-[family-name:var(--font-syne)]">
                        {totalContacts.toLocaleString()}
                    </p>
                    <p className="text-sm text-text-muted mt-1">Total Contacts</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-accent-cyan font-[family-name:var(--font-syne)]">
                        {uploads.length}
                    </p>
                    <p className="text-sm text-text-muted mt-1">CSV Uploads</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-accent-amber font-[family-name:var(--font-syne)]">{validRate}%</p>
                    <p className="text-sm text-text-muted mt-1">Valid Rate</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-4">Recent Uploads</h3>
                {loading ? (
                    <div className="py-10 text-center text-text-muted">Loading...</div>
                ) : uploads.length === 0 ? (
                    <p className="text-sm text-text-muted italic">No CSV uploads found.</p>
                ) : (
                    <div className="space-y-3">
                        {uploads.map((u) => (
                            <div key={u.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                                <div>
                                    <p className="text-sm font-medium">{u.filename || "Untitled Upload"}</p>
                                    <p className="text-xs text-text-muted uppercase">{u.channel} Channel · {new Date(u.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{u.valid_contacts} valid</p>
                                    <p className="text-xs text-text-muted">{u.total_contacts} total rows</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
