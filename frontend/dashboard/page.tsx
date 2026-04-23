"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { KPICard } from "@/components/KPICard";
import { ChartRenderer } from "@/components/ChartRenderer";
import {
    BarChart3, TrendingUp, AlertTriangle, RefreshCw, Loader2,
    Hash, Grid, AlertOctagon, Copy, Upload, Database, Activity
} from "lucide-react";
import { useRouter } from "next/navigation";

const KPI_COLORS = ["var(--cyan)", "var(--purple)", "var(--green)", "var(--amber)",
    "var(--red)", "var(--cyan)", "var(--purple)", "var(--green)"];

export default function DashboardPage() {
    const { session } = useSession();
    const router = useRouter();
    const [kpis, setKpis] = useState<Record<string, any>>({});
    const [eda, setEda] = useState<any>(null);
    const [charts, setCharts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(false);

    useEffect(() => { if (session) loadData(); }, [session]);

    const loadData = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const [kpiData, edaData] = await Promise.all([api.getKPIs(session.id), api.getEDA(session.id)]);
            setKpis(kpiData);
            setEda(edaData);
            await buildCharts(edaData);
        } finally { setLoading(false); }
    };

    const buildCharts = async (edaData: any) => {
        if (!session || !edaData) return;
        setChartsLoading(true);
        const numCols = edaData.columns?.numeric || [];
        const catCols = edaData.columns?.categorical || [];
        const tasks: any[] = [];
        if (catCols.length > 0 && numCols.length > 0)
            tasks.push({ chart_type: "bar", x_col: catCols[0], y_col: numCols[0], title: `${numCols[0]} by ${catCols[0]}` });
        if (numCols.length >= 2)
            tasks.push({ chart_type: "scatter", x_col: numCols[0], y_col: numCols[1], title: `${numCols[0]} vs ${numCols[1]}` });
        if (numCols.length > 0)
            tasks.push({ chart_type: "histogram", x_col: numCols[0], title: `Distribution of ${numCols[0]}` });
        if (numCols.length >= 2)
            tasks.push({ chart_type: "heatmap", title: "Correlation Matrix" });
        if (catCols.length > 0)
            tasks.push({ chart_type: "pie", x_col: catCols[0], title: `${catCols[0]} Breakdown` });

        const generated: any[] = [];
        for (const task of tasks.slice(0, 4)) {
            try {
                const c = await api.createViz({ session_id: session.id, ...task });
                if (c.image_base64) generated.push(c);
            } catch { }
        }
        setCharts(generated);
        setChartsLoading(false);
    };

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="glass-card anim-scale-in" style={{ padding: "56px 64px", textAlign: "center", maxWidth: 400 }}>
                <div style={{
                    width: 64, height: 64,
                    background: "var(--cyan-dim)",
                    borderRadius: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                }}>
                    <BarChart3 size={28} color="var(--cyan)" />
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                    No Dataset Loaded
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 24 }}>
                    Upload a file to see your dashboard
                </p>
                <button className="btn-primary" onClick={() => router.push("/")} style={{ padding: "10px 28px", fontSize: 13 }}>
                    Upload Data
                </button>
            </div>
        </div>
    );

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{
                    width: 52, height: 52,
                    background: "var(--cyan-dim)",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Loader2 size={24} color="var(--cyan)" style={{ animation: "spin 1s linear infinite" }} />
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Loading dashboard...</div>
                <div className="progress-bar" style={{ width: 200 }}>
                    <div className="progress-fill" style={{ width: "60%" }} />
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const kpiList = Object.entries(kpis).slice(0, 8);
    const missingCount = Object.keys(eda?.missing_values || {}).length;

    return (
        <div style={{ padding: "32px 32px 48px", minHeight: "100vh" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Page Header */}
            <div className="anim-fade-up" style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28,
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <div className="status-dot" />
                        <span style={{ fontSize: 11, color: "var(--cyan)", letterSpacing: "0.06em", fontWeight: 500 }}>
                            LIVE ANALYSIS
                        </span>
                    </div>
                    <h1 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 28, fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em", marginBottom: 4,
                    }}>
                        {session.file_name}
                    </h1>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                            {session.rows?.toLocaleString()} rows
                        </span>
                        <span style={{ color: "var(--border)" }}>·</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                            {session.columns} columns
                        </span>
                        {eda && (
                            <>
                                <span style={{ color: "var(--border)" }}>·</span>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                                    {eda.memory_usage_kb?.toFixed(1)} KB
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <button className="btn-ghost"
                    onClick={loadData}
                    style={{ padding: "9px 16px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                    <RefreshCw size={13} />
                    Refresh
                </button>
            </div>

            {/* EDA Meta Cards */}
            {eda && (
                <div className="anim-fade-up delay-1" style={{
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20,
                }}>
                    {[
                        { label: "Numeric Cols", val: eda.columns?.numeric?.length || 0, icon: <TrendingUp size={13} color="var(--cyan)" />, color: "var(--cyan)" },
                        { label: "Categorical Cols", val: eda.columns?.categorical?.length || 0, icon: <Hash size={13} color="var(--purple)" />, color: "var(--purple)" },
                        { label: "Missing Values", val: missingCount, icon: <AlertOctagon size={13} color="var(--amber)" />, color: "var(--amber)" },
                        { label: "Duplicate Rows", val: eda.duplicates || 0, icon: <Copy size={13} color="var(--red)" />, color: "var(--red)" },
                    ].map(({ label, val, icon, color }, i) => (
                        <div key={label} className="glass-card" style={{ padding: "14px 16px", animationDelay: `${i * 60}ms` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                {icon}
                                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                    {label}
                                </span>
                            </div>
                            <div style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 28, fontWeight: 700,
                                color,
                            }}>
                                {val}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* KPI Cards */}
            {kpiList.length > 0 && (
                <>
                    <div className="anim-fade-up delay-2" style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                    }}>
                        <Activity size={14} color="var(--cyan)" />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Key Metrics
                        </span>
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: 12, marginBottom: 32,
                    }}>
                        {kpiList.map(([key, kpi], i) => (
                            <KPICard
                                key={key}
                                label={kpi.label}
                                value={kpi.value}
                                format={kpi.format}
                                accentColor={KPI_COLORS[i % KPI_COLORS.length]}
                                delay={i * 80}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Column Summary */}
            {eda?.columns && (
                <div className="anim-fade-up delay-3 glass-card" style={{ padding: "18px 20px", marginBottom: 32 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                        Column Overview
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {eda.columns.all?.slice(0, 20).map((col: string) => {
                            const isNum = eda.columns.numeric?.includes(col);
                            const isCat = eda.columns.categorical?.includes(col);
                            return (
                                <span key={col} style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 11.5, padding: "3px 10px",
                                    borderRadius: 6,
                                    background: isNum ? "rgba(0,212,255,0.08)" : isCat ? "rgba(124,92,252,0.08)" : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${isNum ? "rgba(0,212,255,0.2)" : isCat ? "rgba(124,92,252,0.2)" : "var(--border)"}`,
                                    color: isNum ? "var(--cyan)" : isCat ? "var(--purple)" : "var(--text-muted)",
                                }}>
                                    {col}
                                </span>
                            );
                        })}
                        {eda.columns.all?.length > 20 && (
                            <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "3px 6px" }}>
                                +{eda.columns.all.length - 20} more
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--cyan)", display: "inline-block" }} />
                            Numeric
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--purple)", display: "inline-block" }} />
                            Categorical
                        </span>
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="anim-fade-up delay-4">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Grid size={14} color="var(--cyan)" />
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Auto-Generated Charts
                        </span>
                    </div>
                    {chartsLoading && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                            <Loader2 size={13} color="var(--cyan)" style={{ animation: "spin 1s linear infinite" }} />
                            Generating...
                        </div>
                    )}
                </div>

                {charts.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {charts.map((chart, i) => (
                            <ChartRenderer key={i} chart={chart} />
                        ))}
                    </div>
                ) : !chartsLoading ? (
                    <div className="glass-card" style={{ padding: "48px 32px", textAlign: "center" }}>
                        <BarChart3 size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Charts will appear here after analysis</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="glass-card skeleton" style={{ height: 280 }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}