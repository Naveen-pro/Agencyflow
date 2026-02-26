"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signInWithGitHub, loginWithEmail, sendPhoneOTP, verifyPhoneOTP } from "@/lib/firebase/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOTP] = useState("");
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"email" | "phone">("email");

    const handleGoogle = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGitHub = async () => {
        try {
            setLoading(true);
            await signInWithGitHub();
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            await loginWithEmail(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        try {
            setLoading(true);
            await sendPhoneOTP(phone);
            setShowOTP(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        try {
            setLoading(true);
            await verifyPhoneOTP(otp);
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
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 font-[family-name:var(--font-syne)]">
                        AF
                    </div>
                    <h1 className="text-2xl font-bold font-[family-name:var(--font-syne)]">Welcome Back</h1>
                    <p className="text-sm text-text-muted mt-1">Sign in to your AgencyFlow account</p>
                </div>

                {/* Social Login */}
                <div className="space-y-3 mb-6">
                    <button onClick={handleGoogle} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-surface border border-border-bright rounded-xl text-sm font-medium hover:border-accent/50 transition-all">
                        🔵 Continue with Google
                    </button>
                    <button onClick={handleGitHub} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-surface border border-border-bright rounded-xl text-sm font-medium hover:border-accent/50 transition-all">
                        ⚫ Continue with GitHub
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-muted">OR</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Tabs */}
                <div className="flex rounded-lg bg-elevated p-1 mb-6">
                    <button onClick={() => setTab("email")} className={`flex-1 py-2 text-sm rounded-md transition-all ${tab === "email" ? "bg-accent text-white" : "text-text-muted"}`}>Email</button>
                    <button onClick={() => setTab("phone")} className={`flex-1 py-2 text-sm rounded-md transition-all ${tab === "phone" ? "bg-accent text-white" : "text-text-muted"}`}>Phone OTP</button>
                </div>

                {tab === "email" ? (
                    <form onSubmit={handleEmail} className="space-y-4">
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm focus:border-accent focus:outline-none" />
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm focus:border-accent focus:outline-none" />
                        <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl font-semibold text-sm">
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm focus:border-accent focus:outline-none" />
                        {!showOTP ? (
                            <button onClick={handleSendOTP} disabled={loading} className="w-full py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl font-semibold text-sm">
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        ) : (
                            <>
                                <input value={otp} onChange={(e) => setOTP(e.target.value)} placeholder="Enter 6-digit OTP" className="w-full bg-elevated border border-border-bright rounded-lg px-4 py-3 text-sm text-center tracking-widest font-[family-name:var(--font-mono)] focus:border-accent focus:outline-none" />
                                <button onClick={handleVerifyOTP} disabled={loading} className="w-full py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl font-semibold text-sm">
                                    {loading ? "Verifying..." : "Verify OTP"}
                                </button>
                            </>
                        )}
                        <div id="recaptcha-container" />
                    </div>
                )}

                {error && <p className="text-sm text-accent-red text-center mt-4">{error}</p>}

                <p className="text-sm text-text-muted text-center mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-accent hover:underline">Start free trial</Link>
                </p>
            </div>
        </div>
    );
}
