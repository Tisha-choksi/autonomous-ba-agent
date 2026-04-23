interface KPICardProps {
    label: string;
    value: number | string;
    format?: "number" | "currency" | "percent";
    change?: number;
}

export function KPICard({ label, value, format = "number", change }: KPICardProps) {
    const formatValue = (v: number | string) => {
        if (typeof v !== "number") return v;
        if (format === "currency") return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (format === "percent") return `${v.toFixed(1)}%`;
        return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="text-xs text-slate-400 mb-2 truncate">{label}</div>
            <div className="text-xl font-bold text-white truncate">{formatValue(value)}</div>
            {change !== undefined && (
                <div className={`text-xs mt-1 ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
                </div>
            )}
        </div>
    );
}