"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { KPICard } from "@/components/KPICard";
import { ChartRenderer } from "@/components/ChartRenderer";
import { BarChart3, TrendingUp, AlertTriangle, RefreshCw, Loader2, Hash, Copy, Activity, Grid3x3 } from "lucide-react";
import { useRouter } from "next/navigation";

const COLORS = ["#00D4FF", "#7C5CFC", "#00FF94", "#FFB547", "#FF4D6A", "#00D4FF", "#7C5CFC", "#00FF94"];

export default function DashboardPage() {
    const { session } = useSession();
    const router = useRouter();
    const [kpis, setKpis] = useState<Record<string, any>>({});
    const [eda, setEda] = useState<any>(null);
    const [charts, setCharts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(false);

    useEffect(() => { if (session) load(); }, [session]);

    const load = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const [kd, ed] = await Promise.all([api.getKPIs(session.id), api.getEDA(session.id)]);
            setKpis(kd); setEda(ed);
            await buildCharts(ed);
        } finally { setLoading(false); }
    };

    const buildCharts = async (ed: any) => {
        if (!session || !ed) return;
        setChartsLoading(true);
        const num = ed.columns?.numeric || [];
        const cat = ed.columns?.categorical || [];
        const tasks: any[] = [];
        if (cat.length > 0 && num.length > 0) tasks.push({ chart_type: "bar", x_col: cat[0], y_col: num[0], title: `${num[0]} by ${cat[0]}` });
        if (num.length >= 2) tasks.push({ chart_type: "scatter", x_col: num[0], y_col: num[1], title: `${num[0]} vs ${num[1]}` });
        if (num.length > 0) tasks.push({ chart_type: "histogram", x_col: num[0], title: `Distribution of ${num[0]}` });
        if (num.length >= 2) tasks.push({ chart_type: "heatmap", title: "Correlation Matrix" });
        const gen: any[] = [];
        for (const t of tasks.slice(0, 4)) {
            try { const c = await api.createViz({ session_id: session.id, ...t }); if (c.image_base64) gen.push(c); } catch { }
        }
        setCharts(gen); setChartsLoading(false);
    };

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{ padding: "56px 64px", textAlign: "center", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 20 }}>
                <BarChart3 size={44} color="#3D5278" style={{ margin: "0 auto 16px", display: "block" }} />
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#EEF2FF", marginBottom: 8 }}>No Dataset Loaded</div>
                <p style={{ fontSize: 13.5, color: "#3D5278", marginBottom: 24 }}>Upload a file to see your dashboard</p>
                <button onClick={() => router.push("/")} style={{ padding: "10px 28px", fontSize: 13, fontWeight: 600, background: "linear-gradient(135deg,#00D4FF,#0099CC)", color: "#020812", border: "none", borderRadius: 10, cursor: "pointer" }}>Upload Data</button>
            </div>
        </div>
    );

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,212,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 size={24} color="#00D4FF" style={{ animation: "spin 1s linear infinite" }} />
                </div>
                <div style={{ fontSize: 14, color: "#8BA3C7" }}>Loading dashboard...</div>
                <div className="progress-bar" style={{ width: 200 }}><div className="progress-fill" style={{ width: "55%" }} /></div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: "32px 32px 56px", minHeight: "100vh" }}>

            {/* Header */}
            <div className="anim-fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span className="status-dot" />
                        <span style={{ fontSize: 11, color: "#00D4FF", letterSpacing: "0.06em", fontWeight: 500 }}>LIVE ANALYSIS</span>
                    </div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 700, color: "#EEF2FF", letterSpacing: "-0.02em", marginBottom: 4 }}>{session.file_name}</h1>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#3D5278" }}>
                        <span>{session.rows?.toLocaleString()} rows</span>
                        <span style={{ color: "rgba(0,212,255,0.2)" }}>·</span>
                        <span>{session.columns} columns</span>
                        {eda && <><span style={{ color: "rgba(0,212,255,0.2)" }}>·</span><span>{eda.memory_usage_kb?.toFixed(1)} KB</span></>}
                    </div>
                </div>
                <button onClick={load} style={{ padding: "9px 16px", fontSize: 12.5, fontWeight: 500, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 10, cursor: "pointer", color: "#8BA3C7", display: "flex", alignItems: "center", gap: 6 }}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* EDA meta cards */}
            {eda && (
                <div className="anim-fade-up delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                        { label: "Numeric Cols", val: eda.columns?.numeric?.length || 0, icon: TrendingUp, color: "#00D4FF" },
                        { label: "Categorical Cols", val: eda.columns?.categorical?.length || 0, icon: Hash, color: "#7C5CFC" },
                        { label: "Missing Values", val: Object.keys(eda.missing_values || {}).length, icon: AlertTriangle, color: "#FFB547" },
                        { label: "Duplicate Rows", val: eda.duplicates || 0, icon: Copy, color: "#FF4D6A" },
                    ].map(({ label, val, icon: Icon, color }, i) => (
                        <div key={label} style={{ padding: "14px 16px", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                <Icon size={13} color={color} />
                                <span style={{ fontSize: 11, color: "#3D5278", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                            </div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 700, color }}>{val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* KPI Cards */}
            {Object.keys(kpis).length > 0 && (
                <>
                    <div className="anim-fade-up delay-2" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <Activity size={14} color="#00D4FF" />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#3D5278", textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Metrics</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 32 }}>
                        {Object.entries(kpis).slice(0, 8).map(([key, kpi]: [string, any], i) => (
                            <KPICard key={key} label={kpi.label} value={kpi.value} format={kpi.format} accentColor={COLORS[i % COLORS.length]} delay={i * 80} />
                        ))}
                    </div>
                </>
            )}

            {/* Column tags */}
            {eda?.columns?.all && (
                <div className="anim-fade-up delay-3" style={{ padding: "18px 20px", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 14, marginBottom: 32 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#3D5278", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Column Overview</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {eda.columns.all.slice(0, 24).map((col: string) => {
                            const isNum = eda.columns.numeric?.includes(col);
                            const isCat = eda.columns.categorical?.includes(col);
                            return (
                                <span key={col} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, padding: "3px 10px", borderRadius: 6, background: isNum ? "rgba(0,212,255,0.08)" : isCat ? "rgba(124,92,252,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${isNum ? "rgba(0,212,255,0.2)" : isCat ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.06)"}`, color: isNum ? "#00D4FF" : isCat ? "#7C5CFC" : "#3D5278" }}>{col}</span>
                            );
                        })}
                        {eda.columns.all.length > 24 && <span style={{ fontSize: 11, color: "#3D5278", padding: "3px 6px" }}>+{eda.columns.all.length - 24} more</span>}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        {[{ color: "#00D4FF", label: "Numeric" }, { color: "#7C5CFC", label: "Categorical" }].map(({ color, label }) => (
                            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#3D5278" }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />{label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="anim-fade-up delay-4">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Grid3x3 size={14} color="#00D4FF" />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#3D5278", textTransform: "uppercase", letterSpacing: "0.06em" }}>Auto-Generated Charts</span>
                    </div>
                    {chartsLoading && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#3D5278" }}><Loader2 size={13} color="#00D4FF" style={{ animation: "spin 1s linear infinite" }} /> Generating...</div>}
                </div>

                {charts.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {charts.map((c, i) => <ChartRenderer key={i} chart={c} />)}
                    </div>
                ) : chartsLoading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}
                    </div>
                ) : (
                    <div style={{ padding: "48px 32px", textAlign: "center", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 14 }}>
                        <BarChart3 size={32} color="#3D5278" style={{ margin: "0 auto 12px", display: "block" }} />
                        <p style={{ fontSize: 14, color: "#3D5278" }}>Charts will appear after analysis</p>
                    </div>
                )}
            </div>
        </div>
    );
}