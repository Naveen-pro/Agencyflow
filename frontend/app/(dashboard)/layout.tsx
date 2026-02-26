"use client";
import { useEffect } from "react";
import Sidebar from "@/components/shared/Sidebar";
import DashboardHeader from "@/components/shared/DashboardHeader";
import { useAuthStore } from "@/lib/stores/authStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { initialize } = useAuthStore();

    useEffect(() => {
        const unsubscribe = initialize();
        return unsubscribe;
    }, [initialize]);

    return (
        <div className="flex min-h-screen bg-base">
            <Sidebar />
            <main className="flex-1 ml-64">
                <DashboardHeader />
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
