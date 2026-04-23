"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Loader2, BarChart2, Link2, Zap, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

const SEV: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
    warning: { icon: AlertTriangle, color: "#FFB547", bg: "rgba(255,181,71,0.08)", border: "rgba(255,181,71,0.25)", label: "Warning" },
    success: { icon: CheckCircle, color: "#00FF94", bg: "rgba(0,255,148,0.08)", border: "rgba(0,255,148,0.25)", label: "Success" },
    info: { icon: Lightbulb, color: "#00D4FF", bg: "rgba(0,212,255,0.07)", border: "rgba(0,212,255,0.20)", label: "Info" },
};
const TYPES: Record<string, { label: string; icon: any; color: string }> = {
    data_quality: { label: "Data Quality", icon: AlertTriangle, color: "#FFB547" },
    outlier: { label: "Outlier", icon: Zap, color: "#FF4D6A" },
    distribution: { label: "Distribution", icon: BarChart2, color: "#7C5CFC" },
    correlation: { label: "Correlation", icon: Link2, color: "#00D4FF" },
    trend: { label: "Trend", icon: TrendingUp, color: "#00FF94" },
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

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{ padding: "56px 64px", textAlign: "center", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 20 }}>
                <Lightbulb size={44} color="#3D5278" style={{ margin: "0 auto 16px", display: "block" }} />
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#EEF2FF", marginBottom: 8 }}>No Dataset</div>
                <button onClick={() => router.push("/")} style={{ padding: "10px 26px", fontSize: 13, fontWeight: 600, background: "linear-gradient(135deg,#00D4FF,#0099CC)", color: "#020812", border: "none", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8 }}>
                    <Upload size={14} /> Upload Data
                </button>
            </div>
        </div>
    );

    const visible = filter === "all" ? insights : insights.filter(i => i.severity === filter || i.type === filter);
    const counts = { warning: insights.filter(i => i.severity === "warning").length, success: insights.filter(i => i.severity === "success").length, info: insights.filter(i => i.severity === "info").length };

    return (
        <div style={{ padding: "32px 32px 56px", minHeight: "100vh" }}>

            {/* Header */}
            <div className="anim-fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 700, color: "#EEF2FF", letterSpacing: "-0.02em", marginBottom: 4 }}>AI Insights</h1>
                    <p style={{ fontSize: 13, color: "#3D5278" }}>Auto-discovered patterns, anomalies & correlations</p>
                </div>
                <button onClick={load} style={{ padding: "9px 16px", fontSize: 12.5, fontWeight: 500, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 10, cursor: "pointer", color: "#8BA3C7", display: "flex", alignItems: "center", gap: 6 }}>
                    {loading ? <Loader2 size={13} color="#00D4FF" style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />} Refresh
                </button>
            </div>

            {/* Severity cards */}
            <div className="anim-fade-up delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
                {(["warning", "success", "info"] as const).map(sev => {
                    const cfg = SEV[sev]; const Icon = cfg.icon; const on = filter === sev;
                    return (
                        <button key={sev} onClick={() => setFilter(on ? "all" : sev)} style={{ padding: "18px 20px", textAlign: "left", cursor: "pointer", background: on ? cfg.bg : "rgba(8,18,38,0.85)", border: `1px solid ${on ? cfg.border : "rgba(0,212,255,0.09)"}`, borderRadius: 16, transition: "all 0.25s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Icon size={16} color={cfg.color} />
                                <span style={{ fontSize: 11, color: "#3D5278", fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{cfg.label}</span>
                            </div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{counts[sev]}</div>
                            <div style={{ fontSize: 11, color: "#3D5278", marginTop: 5 }}>{counts[sev] === 1 ? "insight" : "insights"}</div>
                        </button>
                    );
                })}
            </div>

            {/* Type filters */}
            <div className="anim-fade-up delay-2" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>
                <button onClick={() => setFilter("all")} style={{ padding: "5px 14px", fontSize: 11.5, fontWeight: filter === "all" ? 500 : 400, background: filter === "all" ? "rgba(0,212,255,0.10)" : "transparent", border: `1px solid ${filter === "all" ? "rgba(0,212,255,0.35)" : "rgba(0,212,255,0.09)"}`, color: filter === "all" ? "#00D4FF" : "#3D5278", borderRadius: 100, cursor: "pointer" }}>
                    All ({insights.length})
                </button>
                {Object.entries(TYPES).map(([type, cfg]) => {
                    const count = insights.filter(i => i.type === type).length; if (!count) return null;
                    const on = filter === type; const Icon = cfg.icon;
                    return (
                        <button key={type} onClick={() => setFilter(on ? "all" : type)} style={{ padding: "5px 14px", fontSize: 11.5, fontWeight: on ? 500 : 400, background: on ? `${cfg.color}18` : "transparent", border: `1px solid ${on ? `${cfg.color}40` : "rgba(0,212,255,0.09)"}`, color: on ? cfg.color : "#3D5278", borderRadius: 100, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Icon size={10} color={on ? cfg.color : "#3D5278"} />{cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, animationDelay: `${i * 80}ms` }} />)}
                </div>
            ) : visible.length === 0 ? (
                <div style={{ padding: "60px 32px", textAlign: "center", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 14 }}>
                    <Lightbulb size={36} color="#3D5278" style={{ margin: "0 auto 12px", display: "block" }} />
                    <p style={{ fontSize: 14, color: "#3D5278" }}>No insights match this filter</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {visible.map((ins, i) => {
                        const cfg = SEV[ins.severity] ?? SEV.info; const Icon = cfg.icon;
                        const ti = TYPES[ins.type]; const TIcon = ti?.icon ?? Lightbulb;
                        const cols: string[] = ins.columns ?? (ins.column ? [ins.column] : []);
                        return (
                            <div key={i} className="anim-fade-up" style={{ padding: "18px 20px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 14, animationDelay: `${i * 45}ms` }}>
                                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                    <div style={{ width: 38, height: 38, flexShrink: 0, marginTop: 1, background: `${cfg.color}18`, border: `1px solid ${cfg.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Icon size={17} color={cfg.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" as const }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: "#EEF2FF" }}>{ins.title}</span>
                                            {ti && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 9px", borderRadius: 100, background: `${ti.color}15`, border: `1px solid ${ti.color}30`, color: ti.color, fontWeight: 500 }}><TIcon size={9} color={ti.color} />{ti.label}</span>}
                                        </div>
                                        <p style={{ fontSize: 13, color: "#8BA3C7", lineHeight: 1.6 }}>{ins.description}</p>
                                        {cols.length > 0 && (
                                            <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                                                {cols.filter(Boolean).map((col: string) => (
                                                    <span key={col} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 5, padding: "2px 8px", color: "#8BA3C7" }}>{col}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6, background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}