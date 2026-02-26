"use client";
import { useAuthStore } from "@/lib/stores/authStore";
import { logout } from "@/lib/firebase/auth";

export default function DashboardHeader() {
    const { user } = useAuthStore();

    return (
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <h2 className="text-sm text-text-muted font-medium">
                    Welcome back,{" "}
                    <span className="text-text-primary font-semibold">
                        {user?.displayName || user?.email || "User"}
                    </span>
                </h2>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-64 bg-elevated border border-border-bright rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                    />
                </div>

                {/* User avatar */}
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-bright text-text-muted hover:text-text-primary hover:border-accent transition-all text-sm"
                >
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                            {(user?.displayName || "U")[0]}
                        </div>
                    )}
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}
