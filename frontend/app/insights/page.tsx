"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import {
    Lightbulb, AlertTriangle, CheckCircle, TrendingUp,
    RefreshCw, Loader2, BarChart2, Link2, Zap, Upload
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ── Color tokens ── */
const C = {
    cyan: "#00D4FF",
    cyanDim: "rgba(0,212,255,0.10)",
    cyanBorder: "rgba(0,212,255,0.22)",
    purple: "#7C5CFC",
    green: "#00FF94",
    greenDim: "rgba(0,255,148,0.09)",
    greenBorder: "rgba(0,255,148,0.25)",
    amber: "#FFB547",
    amberDim: "rgba(255,181,71,0.09)",
    amberBorder: "rgba(255,181,71,0.25)",
    red: "#FF4D6A",
    card: "rgba(8,18,38,0.85)",
    border: "rgba(0,212,255,0.09)",
    text: "#EEF2FF",
    secondary: "#8BA3C7",
    muted: "#3D5278",
    display: "'Syne', sans-serif",
    mono: "'JetBrains Mono', monospace",
};

/* ── Severity config ── */
const SEV: Record<string, {
    icon: any; color: string; bg: string; border: string; label: string;
}> = {
    warning: { icon: AlertTriangle, color: C.amber, bg: C.amberDim, border: C.amberBorder, label: "Warning" },
    success: { icon: CheckCircle, color: C.green, bg: C.greenDim, border: C.greenBorder, label: "Success" },
    info: { icon: Lightbulb, color: C.cyan, bg: C.cyanDim, border: C.cyanBorder, label: "Info" },
};

/* ── Type config ── */
const TYPES: Record<string, { label: string; icon: any; color: string }> = {
    data_quality: { label: "Data Quality", icon: AlertTriangle, color: C.amber },
    outlier: { label: "Outlier", icon: Zap, color: C.red },
    distribution: { label: "Distribution", icon: BarChart2, color: C.purple },
    correlation: { label: "Correlation", icon: Link2, color: C.cyan },
    trend: { label: "Trend", icon: TrendingUp, color: C.green },
};

export default function InsightsPage() {
    const { session } = useSession();
    const router = useRouter();
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");

    useEffect(() => { if (session) load(); }, [session]);

    const load = async () => {
        if (!session) return;
        setLoading(true);
        try { setInsights(await api.refreshInsights(session.id)); }
        finally { setLoading(false); }
    };

    /* ── No session ── */
    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{
                padding: "56px 64px", textAlign: "center",
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
            }}>
                <Lightbulb size={44} color={C.muted} style={{ margin: "0 auto 16px", display: "block" }} />
                <h2 style={{ fontFamily: C.display, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                    No Dataset
                </h2>
                <p style={{ fontSize: 13.5, color: C.muted, marginBottom: 24 }}>
                    Upload a file to discover insights
                </p>
                <button
                    onClick={() => router.push("/")}
                    style={{
                        padding: "10px 26px", fontSize: 13, fontWeight: 600,
                        background: "linear-gradient(135deg, #00D4FF, #0099CC)",
                        color: "#020812", border: "none", borderRadius: 10, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 7,
                    }}>
                    <Upload size={14} /> Upload Data
                </button>
            </div>
        </div>
    );

    /* ── Derived data ── */
    const visible = filter === "all"
        ? insights
        : insights.filter(i => i.severity === filter || i.type === filter);

    const counts = {
        warning: insights.filter(i => i.severity === "warning").length,
        success: insights.filter(i => i.severity === "success").length,
        info: insights.filter(i => i.severity === "info").length,
    };

    /* ── Page ── */
    return (
        <div style={{ padding: "32px 32px 56px", minHeight: "100vh" }}>

            {/* Header */}
            <div className="anim-fade-up" style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28,
            }}>
                <div>
                    <h1 style={{
                        fontFamily: C.display, fontSize: 28, fontWeight: 700,
                        color: C.text, letterSpacing: "-0.02em", marginBottom: 4,
                    }}>
                        AI Insights
                    </h1>
                    <p style={{ fontSize: 13, color: C.muted }}>
                        Auto-discovered patterns, anomalies & correlations
                    </p>
                </div>
                <button
                    onClick={load}
                    style={{
                        padding: "9px 16px", fontSize: 12.5, fontWeight: 500,
                        background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                        borderRadius: 10, cursor: "pointer", color: C.secondary,
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {loading
                        ? <Loader2 size={13} color={C.cyan} style={{ animation: "spin 1s linear infinite" }} />
                        : <RefreshCw size={13} />}
                    Refresh
                </button>
            </div>

            {/* Severity summary cards */}
            <div className="anim-fade-up delay-1"
                style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
                {(["warning", "success", "info"] as const).map(sev => {
                    const cfg = SEV[sev];
                    const Icon = cfg.icon;
                    const isActive = filter === sev;
                    const count = counts[sev];
                    return (
                        <button
                            key={sev}
                            onClick={() => setFilter(isActive ? "all" : sev)}
                            style={{
                                padding: "18px 20px", textAlign: "left", cursor: "pointer",
                                background: isActive ? cfg.bg : C.card,
                                border: `1px solid ${isActive ? cfg.border : C.border}`,
                                borderRadius: 16, transition: "all 0.25s ease",
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Icon size={16} color={cfg.color} />
                                <span style={{
                                    fontSize: 11, color: C.muted, fontWeight: 500,
                                    textTransform: "uppercase" as const, letterSpacing: "0.07em",
                                }}>
                                    {cfg.label}
                                </span>
                            </div>
                            <div style={{
                                fontFamily: C.display, fontSize: 36, fontWeight: 800,
                                color: cfg.color, lineHeight: 1,
                            }}>
                                {count}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>
                                {count === 1 ? "insight" : "insights"}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Type filter pills */}
            <div className="anim-fade-up delay-2"
                style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>

                {/* All */}
                <button
                    onClick={() => setFilter("all")}
                    style={{
                        padding: "5px 14px", fontSize: 11.5, fontWeight: filter === "all" ? 500 : 400,
                        background: filter === "all" ? C.cyanDim : "transparent",
                        border: `1px solid ${filter === "all" ? C.cyanBorder : C.border}`,
                        color: filter === "all" ? C.cyan : C.muted,
                        borderRadius: 100, cursor: "pointer",
                    }}>
                    All ({insights.length})
                </button>

                {/* Per type */}
                {Object.entries(TYPES).map(([type, cfg]) => {
                    const count = insights.filter(i => i.type === type).length;
                    const isActive = filter === type;
                    const Icon = cfg.icon;
                    if (!count) return null;
                    return (
                        <button
                            key={type}
                            onClick={() => setFilter(isActive ? "all" : type)}
                            style={{
                                padding: "5px 14px", fontSize: 11.5, fontWeight: isActive ? 500 : 400,
                                background: isActive ? `${cfg.color}18` : "transparent",
                                border: `1px solid ${isActive ? `${cfg.color}40` : C.border}`,
                                color: isActive ? cfg.color : C.muted,
                                borderRadius: 100, cursor: "pointer",
                                display: "inline-flex", alignItems: "center", gap: 5,
                            }}>
                            <Icon size={10} color={isActive ? cfg.color : C.muted} />
                            {cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                /* Skeleton */
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 90, animationDelay: `${i * 90}ms` }} />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                /* Empty */
                <div style={{
                    padding: "60px 32px", textAlign: "center",
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
                }}>
                    <Lightbulb size={36} color={C.muted} style={{ margin: "0 auto 12px", display: "block" }} />
                    <p style={{ fontSize: 14, color: C.muted }}>No insights match this filter</p>
                </div>
            ) : (
                /* Insight cards */
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {visible.map((ins, i) => {
                        const cfg = SEV[ins.severity] ?? SEV.info;
                        const Icon = cfg.icon;
                        const typeInfo = TYPES[ins.type];
                        const TypeIcon = typeInfo?.icon ?? Lightbulb;
                        const cols: string[] = ins.columns ?? (ins.column ? [ins.column] : []);

                        return (
                            <div
                                key={i}
                                className="anim-fade-up"
                                style={{
                                    padding: "18px 20px",
                                    background: cfg.bg,
                                    border: `1px solid ${cfg.border}`,
                                    borderRadius: 14,
                                    animationDelay: `${i * 45}ms`,
                                }}>

                                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: 38, height: 38, flexShrink: 0, marginTop: 1,
                                        background: `${cfg.color}18`,
                                        border: `1px solid ${cfg.border}`,
                                        borderRadius: 10,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Icon size={17} color={cfg.color} />
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Title row */}
                                        <div style={{
                                            display: "flex", alignItems: "center",
                                            gap: 8, marginBottom: 5, flexWrap: "wrap" as const,
                                        }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                                                {ins.title}
                                            </span>
                                            {typeInfo && (
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                    fontSize: 10, padding: "2px 9px", borderRadius: 100,
                                                    background: `${typeInfo.color}15`,
                                                    border: `1px solid ${typeInfo.color}30`,
                                                    color: typeInfo.color, fontWeight: 500,
                                                }}>
                                                    <TypeIcon size={9} color={typeInfo.color} />
                                                    {typeInfo.label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.6 }}>
                                            {ins.description}
                                        </p>

                                        {/* Column pills */}
                                        {cols.length > 0 && (
                                            <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                                                {cols.filter(Boolean).map((col: string) => (
                                                    <span key={col} style={{
                                                        fontFamily: C.mono, fontSize: 11,
                                                        background: "rgba(255,255,255,0.05)",
                                                        border: `1px solid ${C.border}`,
                                                        borderRadius: 5, padding: "2px 8px", color: C.secondary,
                                                    }}>
                                                        {col}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Severity dot */}
                                    <div style={{
                                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6,
                                        background: cfg.color,
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