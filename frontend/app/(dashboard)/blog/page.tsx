"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { apiClient } from "@/lib/api";

export default function BlogPage() {
    const { agency } = useAuthStore();
    const [feeds, setFeeds] = useState<any[]>([]);
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newFeed, setNewFeed] = useState({ name: "", url: "" });
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!agency) return;
        fetchData();
    }, [agency]);

    const fetchData = async () => {
        if (!agency) return;
        try {
            setLoading(true);
            const [feedsResp, queueResp] = await Promise.all([
                apiClient.get(`/blog/feeds/${agency.id}`),
                apiClient.get(`/blog/queue/${agency.id}`)
            ]);
            setFeeds(feedsResp.data || []);
            setQueue(queueResp.data || []);
        } catch (err) {
            console.error("Failed to fetch blog data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post("/blog/feeds", { 
                name: newFeed.name, 
                url: newFeed.url 
            });
            setShowModal(false);
            setNewFeed({ name: "", url: "" });
            fetchData();
        } catch (err) {
            alert("Failed to add feed. Make sure it's a valid RSS URL.");
        }
    };

    const handleScan = async () => {
        try {
            setIsScanning(true);
            await apiClient.post("/blog/scan");
            alert("Scan started in background. Refresh in a moment.");
        } catch (err) {
            alert("Failed to trigger scan.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">📰 Blog Content Engine</h1>
                    <p className="text-sm text-text-muted mt-1">RSS-to-Campaign pipeline with AI content generation</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all"
                >
                    + Add RSS Feed
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RSS Feeds */}
                <div className="bg-surface border border-border rounded-xl p-6 h-fit">
                    <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-4">RSS Feeds</h3>
                    {loading ? (
                        <div className="text-sm text-text-muted italic">Loading feeds...</div>
                    ) : feeds.length === 0 ? (
                        <div className="text-sm text-text-muted italic">No feeds added yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {feeds.map((feed) => (
                                <div key={feed.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{feed.name}</p>
                                        <p className="text-xs text-text-muted font-[family-name:var(--font-mono)] truncate max-w-[200px]">{feed.url}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${feed.is_active ? "bg-accent-cyan pulse-dot" : "bg-accent-red"}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Blog Queue */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold font-[family-name:var(--font-syne)]">Content Queue</h3>
                        <button 
                            onClick={handleScan}
                            disabled={isScanning}
                            className="text-xs px-3 py-1.5 border border-border-bright rounded-lg text-text-muted hover:text-accent hover:border-accent/50 transition-all disabled:opacity-50"
                        >
                            {isScanning ? "Scanning..." : "🔄 Scan Now"}
                        </button>
                    </div>
                    {loading ? (
                        <div className="text-sm text-text-muted italic">Loading queue...</div>
                    ) : queue.length === 0 ? (
                        <div className="text-sm text-text-muted italic">AI-generated items will appear here after a scan.</div>
                    ) : (
                        <div className="space-y-4">
                            {queue.map((item) => (
                                <div key={item.id} className="p-3 bg-elevated rounded-lg border border-border-bright">
                                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                                            item.status === "pending" ? "bg-accent-amber/10 text-accent-amber border border-accent-amber/30" : "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
                                        }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-[10px] text-text-muted">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Feed Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold font-[family-name:var(--font-syne)] mb-4">Add RSS Feed</h3>
                        <form onSubmit={handleAddFeed} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Feed Name (e.g. My Blog)</label>
                                <input 
                                    required
                                    type="text"
                                    value={newFeed.name}
                                    onChange={(e) => setNewFeed({...newFeed, name: e.target.value})}
                                    className="w-full bg-elevated border border-border text-text-primary rounded-lg px-4 py-2.5 focus:border-accent outline-none"
                                    placeholder="Enter a descriptive name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Feed URL (XML/RSS)</label>
                                <input 
                                    required
                                    type="url"
                                    value={newFeed.url}
                                    onChange={(e) => setNewFeed({...newFeed, url: e.target.value})}
                                    className="w-full bg-elevated border border-border text-text-primary rounded-lg px-4 py-2.5 focus:border-accent outline-none"
                                    placeholder="https://example.com/feed"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl font-bold">
                                    Save Feed
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 border border-border-bright rounded-xl text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
