"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import {
    Lightbulb, AlertTriangle, CheckCircle, TrendingUp,
    RefreshCw, Loader2, Upload, BarChart2, Link2, Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

const SEV_CONFIG: Record<string, any> = {
    warning: { icon: AlertTriangle, color: "var(--amber)", bg: "rgba(255,181,71,0.07)", border: "rgba(255,181,71,0.2)", badge: "badge-amber" },
    success: { icon: CheckCircle, color: "var(--green)", bg: "rgba(0,255,148,0.07)", border: "rgba(0,255,148,0.2)", badge: "badge-green" },
    info: { icon: Lightbulb, color: "var(--cyan)", bg: "rgba(0,212,255,0.06)", border: "rgba(0,212,255,0.18)", badge: "badge-cyan" },
};

const TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    data_quality: { label: "Data Quality", icon: AlertTriangle, color: "var(--amber)" },
    outlier: { label: "Outlier", icon: Zap, color: "var(--red)" },
    distribution: { label: "Distribution", icon: BarChart2, color: "var(--purple)" },
    correlation: { label: "Correlation", icon: Link2, color: "var(--cyan)" },
    trend: { label: "Trend", icon: TrendingUp, color: "var(--green)" },
};

export default function InsightsPage() {
    const { session } = useSession();
    const router = useRouter();
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => { if (session) loadInsights(); }, [session]);

    const loadInsights = async () => {
        if (!session) return;
        setLoading(true);
        try { setInsights(await api.refreshInsights(session.id)); }
        finally { setLoading(false); }
    };

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="glass-card anim-scale-in" style={{ padding: "56px 64px", textAlign: "center" }}>
                <Lightbulb size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>No Dataset</h2>
                <button className="btn-primary" onClick={() => router.push("/")} style={{ padding: "9px 22px", fontSize: 13, marginTop: 8 }}>Upload Data</button>
            </div>
        </div>
    );

    const filtered = filter === "all" ? insights : insights.filter(i => i.severity === filter || i.type === filter);
    const counts = {
        warning: insights.filter(i => i.severity === "warning").length,
        success: insights.filter(i => i.severity === "success").length,
        info: insights.filter(i => i.severity === "info").length,
    };

    return (
        <div style={{ padding: "32px 32px 48px", minHeight: "100vh" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div className="anim-fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                        AI Insights
                    </h1>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        Auto-discovered patterns, anomalies & correlations
                    </p>
                </div>
                <button className="btn-ghost" onClick={loadInsights}
                    style={{ padding: "9px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                    {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />}
                    Refresh
                </button>
            </div>

            {/* Severity Summary */}
            <div className="anim-fade-up delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {(["warning", "success", "info"] as const).map(sev => {
                    const cfg = SEV_CONFIG[sev];
                    const Icon = cfg.icon;
                    return (
                        <button key={sev} onClick={() => setFilter(filter === sev ? "all" : sev)}
                            className="glass-card"
                            style={{
                                padding: "16px 20px", cursor: "pointer", background: "none", textAlign: "left",
                                border: `1px solid ${filter === sev ? cfg.border : "var(--border)"}`,
                                background: filter === sev ? cfg.bg : "var(--bg-card)",
                                transition: "all 0.25s ease",
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <Icon size={16} color={cfg.color} />
                                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    {sev}
                                </span>
                            </div>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
                                {counts[sev]}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                {counts[sev] === 1 ? "insight" : "insights"}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Type filters */}
            <div className="anim-fade-up delay-2" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                <button onClick={() => setFilter("all")}
                    className={`badge ${filter === "all" ? "badge-cyan" : ""}`}
                    style={{ cursor: "pointer", border: filter === "all" ? "" : "1px solid var(--border)", background: filter === "all" ? "" : "transparent", color: filter === "all" ? "" : "var(--text-muted)", padding: "6px 14px", fontSize: 11.5 }}>
                    All ({insights.length})
                </button>
                {Object.entries(TYPE_LABELS).map(([type, cfg]) => {
                    const count = insights.filter(i => i.type === type).length;
                    if (!count) return null;
                    const Icon = cfg.icon;
                    return (
                        <button key={type} onClick={() => setFilter(filter === type ? "all" : type)}
                            className="badge"
                            style={{
                                cursor: "pointer", padding: "6px 14px", fontSize: 11.5,
                                background: filter === type ? `${cfg.color}18` : "transparent",
                                border: `1px solid ${filter === type ? cfg.color + "40" : "var(--border)"}`,
                                color: filter === type ? cfg.color : "var(--text-muted)",
                                gap: 5,
                            }}>
                            <Icon size={10} />
                            {cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ display: "grid", gap: 12 }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="glass-card skeleton" style={{ height: 88, animationDelay: `${i * 100}ms` }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ padding: "60px 32px", textAlign: "center" }}>
                    <Lightbulb size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No insights found for this filter</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filtered.map((ins, i) => {
                        const cfg = SEV_CONFIG[ins.severity] || SEV_CONFIG.info;
                        const Icon = cfg.icon;
                        const typeInfo = TYPE_LABELS[ins.type];
                        const TypeIcon = typeInfo?.icon;
                        return (
                            <div key={i} className="glass-card anim-fade-up"
                                style={{
                                    padding: "18px 20px",
                                    border: `1px solid ${cfg.border}`,
                                    background: cfg.bg,
                                    animationDelay: `${i * 50}ms`,
                                }}>
                                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                    <div style={{
                                        width: 36, height: 36,
                                        background: `${cfg.color}18`,
                                        borderRadius: 10,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, marginTop: 1,
                                        border: `1px solid ${cfg.border}`,
                                    }}>
                                        <Icon size={16} color={cfg.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{ins.title}</span>
                                            {typeInfo && (
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                    fontSize: 10, padding: "2px 8px", borderRadius: 100,
                                                    background: `${typeInfo.color}15`,
                                                    border: `1px solid ${typeInfo.color}30`,
                                                    color: typeInfo.color, fontWeight: 500,
                                                }}>
                                                    <TypeIcon size={9} />
                                                    {typeInfo.label}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                                            {ins.description}
                                        </p>
                                        {(ins.column || ins.columns) && (
                                            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                                                {(ins.columns || [ins.column]).filter(Boolean).map((col: string) => (
                                                    <span key={col} style={{
                                                        fontFamily: "var(--font-mono)", fontSize: 11,
                                                        background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                                                        borderRadius: 5, padding: "2px 8px", color: "var(--text-secondary)",
                                                    }}>
                                                        {col}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: "50%",
                                        background: cfg.color,
                                        flexShrink: 0, marginTop: 6,
                                        boxShadow: `0 0 8px ${cfg.color}`,
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}