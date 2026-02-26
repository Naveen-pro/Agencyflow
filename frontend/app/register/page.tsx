"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerWithEmail, signInWithGoogle, signInWithGitHub } from "@/lib/firebase/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [plan, setPlan] = useState("free_trial");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            await registerWithEmail(email, password, name, plan);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 font-[family-name:var(--font-syne)]">
                        AF
                    </div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)]">Start Free Trial</h1>
                    <p className="text-sm text-text-muted mt-1">14 days free — no credit card required</p>
                </div>

                <div className="space-y-3 mb-6">
                    <button onClick={async () => { await signInWithGoogle(); router.push("/dashboard"); }} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-surface border border-border-bright rounded-xl text-sm font-medium hover:border-accent/50 transition-all">
                        🔵 Sign up with Google
                    </button>
                    <button onClick={async () => { await signInWithGitHub(); router.push("/dashboard"); }} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-surface border border-border-bright rounded-xl text-sm font-medium hover:border-accent/50 transition-all">
                        ⚫ Sign up with GitHub
                    </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-muted">OR</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm focus:border-accent focus:outline-none" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm focus:border-accent focus:outline-none" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (6+ characters)" className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm focus:border-accent focus:outline-none" />

                    <div>
                        <label className="block text-sm text-text-muted mb-2">Select Plan</label>
                        <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm focus:border-accent focus:outline-none">
                            <option value="free_trial">Free Trial (14 days)</option>
                            <option value="pro">Pro — ₹2,999/monthly</option>
                            <option value="agency">Agency — ₹9,999/monthly</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl font-semibold text-sm">
                        {loading ? "Creating account..." : "Create Account →"}
                    </button>
                </form>

                {error && <p className="text-sm text-accent-red text-center mt-4">{error}</p>}

                <p className="text-sm text-text-muted text-center mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-accent hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
