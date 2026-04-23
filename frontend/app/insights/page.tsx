"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from "lucide-react";

const SEVERITY_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-950/30", border: "border-yellow-800/50" },
    success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-950/30", border: "border-green-800/50" },
    info: { icon: Lightbulb, color: "text-blue-400", bg: "bg-blue-950/30", border: "border-blue-800/50" },
};

const TYPE_LABELS: Record<string, string> = {
    data_quality: "Data Quality",
    outlier: "Outlier",
    distribution: "Distribution",
    correlation: "Correlation",
    trend: "Trend",
};

export default function InsightsPage() {
    const { session } = useSession();
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session) loadInsights();
    }, [session]);

    const loadInsights = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const data = await api.refreshInsights(session.id);
            setInsights(data);
        } finally {
            setLoading(false);
        }
    };

    if (!session) return (
        <div className="flex items-center justify-center h-screen text-slate-400">Upload a dataset first</div>
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Insights</h1>
                    <p className="text-slate-400 text-sm mt-1">Auto-discovered patterns and anomalies</p>
                </div>
                <button onClick={loadInsights}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Refresh
                </button>
            </div>

            {/* Summary counts */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {["warning", "success", "info"].map(sev => {
                    const count = insights.filter(i => i.severity === sev).length;
                    const cfg = SEVERITY_CONFIG[sev];
                    const Icon = cfg.icon;
                    return (
                        <div key={sev} className={`${cfg.bg} ${cfg.border} border rounded-xl p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={16} className={cfg.color} />
                                <span className="text-sm text-slate-300 capitalize">{sev}</span>
                            </div>
                            <div className={`text-3xl font-bold ${cfg.color}`}>{count}</div>
                        </div>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={32} className="text-blue-400 animate-spin" />
                </div>
            ) : insights.length === 0 ? (
                <div className="text-center py-16 text-slate-400">No insights found</div>
            ) : (
                <div className="grid gap-4">
                    {insights.map((ins, i) => {
                        const cfg = SEVERITY_CONFIG[ins.severity] || SEVERITY_CONFIG.info;
                        const Icon = cfg.icon;
                        return (
                            <div key={i} className={`${cfg.bg} ${cfg.border} border rounded-xl p-5`}>
                                <div className="flex items-start gap-3">
                                    <Icon size={18} className={`${cfg.color} mt-0.5 flex-shrink-0`} />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-white">{ins.title}</h3>
                                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                                {TYPE_LABELS[ins.type] || ins.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300">{ins.description}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}