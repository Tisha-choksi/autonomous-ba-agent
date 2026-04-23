"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import {
    FileDown, FileText, Table, Loader2,
    CheckCircle, Clock, ExternalLink, Sparkles, Upload
} from "lucide-react";
import { useRouter } from "next/navigation";

const REPORT_TYPES = [
    {
        id: "pdf",
        icon: FileText,
        label: "PDF Report",
        desc: "Comprehensive analysis with EDA, KPIs, insights, and data sample",
        features: ["Executive summary", "KPI metrics", "AI insights", "Data sample"],
        color: "var(--red)",
        colorDim: "rgba(255,77,106,0.08)",
        colorBorder: "rgba(255,77,106,0.25)",
        ext: ".pdf",
    },
    {
        id: "excel",
        icon: Table,
        label: "Excel Report",
        desc: "4-sheet workbook with raw data, EDA stats, KPIs, and insights",
        features: ["Raw data sheet", "EDA summary", "KPI dashboard", "Insights sheet"],
        color: "var(--green)",
        colorDim: "rgba(0,255,148,0.07)",
        colorBorder: "rgba(0,255,148,0.25)",
        ext: ".xlsx",
    },
];

export default function ReportsPage() {
    const { session } = useSession();
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) api.listReports(session.id).then(setReports);
    }, [session]);

    const generate = async (type: "pdf" | "excel") => {
        if (!session) return;
        setGenerating(type); setError(null);
        try {
            const result = type === "pdf" ? await api.generatePDF(session.id) : await api.generateExcel(session.id);
            setReports(prev => [{ ...result, created_at: new Date().toISOString(), report_type: type }, ...prev]);
            window.open(api.getDownloadURL(result.file_name), "_blank");
        } catch (e: any) {
            setError(e.message);
        } finally { setGenerating(null); }
    };

    const fmtDate = (ts: string) => new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="glass-card anim-scale-in" style={{ padding: "56px 64px", textAlign: "center" }}>
                <FileDown size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>No Dataset</h2>
                <button className="btn-primary" onClick={() => router.push("/")} style={{ padding: "9px 22px", fontSize: 13, marginTop: 8 }}>Upload Data</button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: "32px 32px 48px", minHeight: "100vh" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div className="anim-fade-up" style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    Reports
                </h1>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Generate comprehensive analysis reports in PDF or Excel format
                </p>
            </div>

            {/* Generate Buttons */}
            <div className="anim-fade-up delay-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40, maxWidth: 680 }}>
                {REPORT_TYPES.map(({ id, icon: Icon, label, desc, features, color, colorDim, colorBorder, ext }) => (
                    <div key={id} className="glass-card"
                        style={{
                            padding: "24px",
                            border: `1px solid ${generating === id ? colorBorder : "var(--border)"}`,
                            background: generating === id ? colorDim : "var(--bg-card)",
                            transition: "all 0.3s ease",
                        }}>
                        {/* Icon */}
                        <div style={{
                            width: 52, height: 52,
                            background: `${color}18`,
                            border: `1px solid ${colorBorder}`,
                            borderRadius: 14,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 16,
                        }}>
                            {generating === id
                                ? <Loader2 size={24} color={color} style={{ animation: "spin 1s linear infinite" }} />
                                : <Icon size={24} color={color} />
                            }
                        </div>

                        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                            {label}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 14 }}>
                            {desc}
                        </div>

                        {/* Features */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 20 }}>
                            {features.map(f => (
                                <div key={f} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                    <Sparkles size={10} color={color} />
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{f}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => generate(id as any)}
                            disabled={!!generating}
                            className="btn-primary"
                            style={{
                                width: "100%", padding: "11px",
                                fontSize: 13, opacity: generating ? 0.6 : 1,
                                background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                                color: id === "excel" ? "#020812" : "white",
                            }}>
                            {generating === id ? "Generating..." : `Generate ${ext}`}
                        </button>
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="anim-fade-up" style={{
                    marginBottom: 24, padding: "12px 16px",
                    background: "var(--red-dim)", border: "1px solid rgba(255,77,106,0.25)",
                    borderRadius: 10, fontSize: 13, color: "var(--red)",
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Past Reports */}
            {reports.length > 0 && (
                <div className="anim-fade-up delay-2">
                    <div style={{
                        fontSize: 11, color: "var(--text-muted)", fontWeight: 500,
                        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14,
                    }}>
                        Generated Reports
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {reports.map((r, i) => {
                            const isPDF = r.report_type === "pdf";
                            const color = isPDF ? "var(--red)" : "var(--green)";
                            const Icon = isPDF ? FileText : Table;
                            return (
                                <div key={i} className="glass-card anim-fade-up"
                                    style={{
                                        padding: "14px 18px",
                                        display: "flex", alignItems: "center", gap: 14,
                                        animationDelay: `${i * 60}ms`,
                                    }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: `${color}15`,
                                        border: `1px solid ${color}30`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={17} color={color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontFamily: "var(--font-mono)", fontSize: 12.5,
                                            color: "var(--text-primary)", fontWeight: 500,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            marginBottom: 3,
                                        }}>
                                            {r.file_name}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
                                            <Clock size={10} />
                                            {fmtDate(r.created_at)}
                                            <span style={{ color: "var(--border)" }}>·</span>
                                            <span style={{ color, fontWeight: 500 }}>{r.report_type?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <CheckCircle size={14} color="var(--green)" />
                                        <a
                                            href={api.getDownloadURL(r.file_name)}
                                            target="_blank" rel="noreferrer"
                                            className="btn-primary"
                                            style={{
                                                padding: "7px 14px", fontSize: 12,
                                                display: "flex", alignItems: "center", gap: 5,
                                                textDecoration: "none",
                                            }}>
                                            <FileDown size={12} /> Download
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}