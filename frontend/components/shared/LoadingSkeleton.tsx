export default function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="bg-elevated rounded-xl p-6">
                    <div className="h-4 bg-border-bright rounded w-1/3 mb-3"></div>
                    <div className="h-3 bg-border rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-border rounded w-1/2"></div>
                </div>
            ))}
        </div>
    );
}
