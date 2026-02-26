import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export function getUsageColor(used: number, limit: number): string {
    const pct = (used / limit) * 100;
    if (pct >= 90) return "from-accent-red to-orange-500";
    if (pct >= 70) return "from-accent-amber to-orange-500";
    return "from-accent to-accent-cyan";
}

export function truncatePhone(phone: string): string {
    if (phone.length <= 6) return phone;
    return `${phone.slice(0, 4)}...${phone.slice(-4)}`;
}
