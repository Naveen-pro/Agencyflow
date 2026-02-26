"use client";

export default function BlogPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">📰 Blog Content Engine</h1>
                    <p className="text-sm text-text-muted mt-1">RSS-to-Campaign pipeline with AI content generation</p>
                </div>
                <button className="px-4 py-2.5 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all">
                    + Add RSS Feed
                </button>
            </div>

            {/* RSS Feeds */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-4">RSS Feeds</h3>
                <div className="space-y-3">
                    {[
                        { name: "TechCrunch", url: "techcrunch.com/feed", articles: 24, active: true },
                        { name: "Marketing Land", url: "marketingland.com/feed", articles: 18, active: true },
                    ].map((feed) => (
                        <div key={feed.name} className="flex items-center justify-between py-2 border-b border-border/50">
                            <div>
                                <p className="font-medium text-sm">{feed.name}</p>
                                <p className="text-xs text-text-muted font-[family-name:var(--font-mono)]">{feed.url}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-text-muted">{feed.articles} articles</span>
                                <span className={`w-2 h-2 rounded-full ${feed.active ? "bg-accent-cyan" : "bg-accent-red"}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Blog Queue */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-4">Content Queue</h3>
                <p className="text-sm text-text-muted">AI-generated teasers and articles from RSS feeds will appear here.</p>
                <button className="mt-3 px-4 py-2 border border-border-bright rounded-lg text-sm text-text-muted hover:text-accent hover:border-accent/50 transition-all">
                    🔄 Scan RSS Feeds Now
                </button>
            </div>
        </div>
    );
}
