"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { KPICard } from "@/components/KPICard";
import { ChartRenderer } from "@/components/ChartRenderer";
import { BarChart3, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { session } = useSession();
    const router = useRouter();
    const [kpis, setKpis] = useState<Record<string, any>>({});
    const [eda, setEda] = useState<any>(null);
    const [charts, setCharts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(false);

    useEffect(() => {
        if (!session) return;
        loadData();
    }, [session]);

    const loadData = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const [kpiData, edaData] = await Promise.all([
                api.getKPIs(session.id),
                api.getEDA(session.id)
            ]);
            setKpis(kpiData);
            setEda(edaData);
            await autoGenerateCharts(edaData);
        } finally {
            setLoading(false);
        }
    };

    const autoGenerateCharts = async (edaData: any) => {
        if (!session || !edaData) return;
        setChartsLoading(true);
        const generated: any[] = [];
        const numCols = edaData.columns?.numeric || [];
        const catCols = edaData.columns?.categorical || [];

        const tasks: Array<{ type: string; x?: string; y?: string; title: string }> = [];

        // Auto-pick meaningful chart combos
        if (catCols.length > 0 && numCols.length > 0) {
            tasks.push({ type: "bar", x: catCols[0], y: numCols[0], title: `${numCols[0]} by ${catCols[0]}` });
        }
        if (numCols.length >= 2) {
            tasks.push({ type: "scatter", x: numCols[0], y: numCols[1], title: `${numCols[0]} vs ${numCols[1]}` });
        }
        if (numCols.length > 0) {
            tasks.push({ type: "histogram", x: numCols[0], title: `Distribution of ${numCols[0]}` });
        }
        if (numCols.length >= 2) {
            tasks.push({ type: "heatmap", title: "Correlation Matrix" });
        }
        if (catCols.length > 0) {
            tasks.push({ type: "pie", x: catCols[0], title: `${catCols[0]} Breakdown` });
        }

        for (const task of tasks.slice(0, 4)) {
            try {
                const chart = await api.createViz({
                    session_id: session.id, chart_type: task.type,
                    x_col: task.x, y_col: task.y, title: task.title
                });
                if (chart.image_base64) generated.push(chart);
            } catch { }
        }
        setCharts(generated);
        setChartsLoading(false);
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <BarChart3 size={48} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">No dataset loaded</p>
                    <button onClick={() => router.push("/")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                        Upload Data
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
        </div>
    );

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">{session.file_name}</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {session.rows?.toLocaleString()} rows · {session.columns} columns
                    </p>
                </div>
                <button onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {Object.entries(kpis).slice(0, 8).map(([key, kpi]: [string, any]) => (
                    <KPICard key={key} label={kpi.label} value={kpi.value} format={kpi.format} />
                ))}
            </div>

            {/* EDA Summary cards */}
            {eda && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Numeric Columns", value: eda.columns?.numeric?.length || 0, icon: TrendingUp, color: "blue" },
                        { label: "Categorical Cols", value: eda.columns?.categorical?.length || 0, icon: BarChart3, color: "purple" },
                        { label: "Missing Values", value: Object.keys(eda.missing_values || {}).length, icon: AlertTriangle, color: "yellow" },
                        { label: "Duplicate Rows", value: eda.duplicates || 0, icon: AlertTriangle, color: "red" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={14} className={`text-${color}-400`} />
                                <span className="text-xs text-slate-400">{label}</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Auto-Generated Charts</h2>
                {chartsLoading && <Loader2 size={16} className="text-blue-400 animate-spin" />}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.map((chart, i) => (
                    <ChartRenderer key={i} chart={chart} />
                ))}
            </div>
        </div>
    );
}