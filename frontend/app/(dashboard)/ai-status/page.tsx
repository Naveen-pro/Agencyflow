"use client";

const AI_PROVIDERS = [
    { name: "Groq", model: "llama3-70b-8192", status: "online", usage: "SMS, Voice", speed: "~200ms" },
    { name: "Gemini", model: "gemini-2.0-flash", status: "online", usage: "WhatsApp, Blog", speed: "~350ms" },
    { name: "DeepSeek", model: "deepseek-chat", status: "online", usage: "Deep Research", speed: "~500ms" },
    { name: "Cohere", model: "command-r-plus", status: "online", usage: "Email", speed: "~400ms" },
    { name: "Together AI", model: "mistralai/Mixtral", status: "online", usage: "Fallback", speed: "~300ms" },
    { name: "HuggingFace", model: "mistralai/Mistral", status: "online", usage: "Fallback", speed: "~600ms" },
    { name: "Ollama", model: "llama3", status: "offline", usage: "Local Dev", speed: "~1s" },
];

export default function AIStatusPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)] tracking-tight">🤖 AI Provider Status</h1>
            <p className="text-sm text-text-muted">Monitor your AI providers and their current availability</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AI_PROVIDERS.map((provider) => (
                    <div key={provider.name} className="bg-surface border border-border rounded-xl p-5 hover:border-border-bright transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold font-[family-name:var(--font-syne)]">{provider.name}</h3>
                            <span className={`flex items-center gap-1.5 text-xs ${provider.status === "online" ? "text-accent-cyan" : "text-accent-red"
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${provider.status === "online" ? "bg-accent-cyan pulse-dot" : "bg-accent-red"
                                    }`} />
                                {provider.status}
                            </span>
                        </div>
                        <p className="text-xs font-[family-name:var(--font-mono)] text-text-muted mb-2">{provider.model}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">{provider.usage}</span>
                            <span className="text-xs font-[family-name:var(--font-mono)] text-accent">{provider.speed}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold font-[family-name:var(--font-syne)] mb-3">AI Usage This Month</h3>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
                        <div className="h-full w-[42%] bg-gradient-to-r from-accent to-accent-cyan rounded-full" />
                    </div>
                    <span className="text-sm font-[family-name:var(--font-mono)]">42 / 100</span>
                </div>
            </div>
        </div>
    );
}
