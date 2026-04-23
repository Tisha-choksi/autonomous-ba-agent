"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { FileDown, FileText, Table, Loader2, CheckCircle, Clock, ExternalLink, Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

const TYPES = [
    { id: "pdf", icon: FileText, label: "PDF Report", desc: "Comprehensive analysis with EDA, KPIs, insights, and data sample", features: ["Executive summary", "KPI metrics", "AI insights", "Data sample"], color: "#FF4D6A", colorDim: "rgba(255,77,106,0.08)", colorBorder: "rgba(255,77,106,0.25)", ext: ".pdf" },
    { id: "excel", icon: Table, label: "Excel Report", desc: "4-sheet workbook: raw data, EDA stats, KPIs, and insights", features: ["Raw data sheet", "EDA summary", "KPI dashboard", "Insights sheet"], color: "#00FF94", colorDim: "rgba(0,255,148,0.07)", colorBorder: "rgba(0,255,148,0.25)", ext: ".xlsx" },
];

export default function ReportsPage() {
    const { session } = useSession();
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (session) api.listReports(session.id).then(setReports); }, [session]);

    const generate = async (type: "pdf" | "excel") => {
        if (!session) return;
        setGenerating(type); setError(null);
        try {
            const r = type === "pdf" ? await api.generatePDF(session.id) : await api.generateExcel(session.id);
            setReports(p => [{ ...r, created_at: new Date().toISOString(), report_type: type }, ...p]);
            window.open(api.getDownloadURL(r.file_name), "_blank");
        } catch (e: any) { setError(e.message); }
        finally { setGenerating(null); }
    };

    const fmtDate = (ts: string) => new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{ padding: "56px 64px", textAlign: "center", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 20 }}>
                <FileDown size={40} color="#3D5278" style={{ margin: "0 auto 16px", display: "block" }} />
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#EEF2FF", marginBottom: 8 }}>No Dataset</div>
                <button onClick={() => router.push("/")} style={{ padding: "10px 22px", fontSize: 13, fontWeight: 600, background: "linear-gradient(135deg,#00D4FF,#0099CC)", color: "#020812", border: "none", borderRadius: 10, cursor: "pointer", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <Upload size={13} /> Upload Data
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: "32px 32px 56px", minHeight: "100vh" }}>

            <div className="anim-fade-up" style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 700, color: "#EEF2FF", letterSpacing: "-0.02em", marginBottom: 4 }}>Reports</h1>
                <p style={{ fontSize: 13, color: "#3D5278" }}>Generate comprehensive analysis reports in PDF or Excel</p>
            </div>

            {/* Generate */}
            <div className="anim-fade-up delay-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40, maxWidth: 680 }}>
                {TYPES.map(({ id, icon: Icon, label, desc, features, color, colorDim, colorBorder, ext }) => (
                    <div key={id} style={{ padding: 24, background: generating === id ? colorDim : "rgba(8,18,38,0.85)", border: `1px solid ${generating === id ? colorBorder : "rgba(0,212,255,0.09)"}`, borderRadius: 18, transition: "all 0.3s" }}>
                        <div style={{ width: 52, height: 52, background: `${color}18`, border: `1px solid ${colorBorder}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                            {generating === id ? <Loader2 size={24} color={color} style={{ animation: "spin 1s linear infinite" }} /> : <Icon size={24} color={color} />}
                        </div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "#EEF2FF", marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 12.5, color: "#3D5278", lineHeight: 1.5, marginBottom: 14 }}>{desc}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 20 }}>
                            {features.map(f => (
                                <div key={f} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                    <Sparkles size={10} color={color} />
                                    <span style={{ fontSize: 12, color: "#3D5278" }}>{f}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => generate(id as any)} disabled={!!generating} style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 600, background: `linear-gradient(135deg,${color},${color}aa)`, color: id === "excel" ? "#020812" : "#fff", border: "none", borderRadius: 10, cursor: "pointer", opacity: generating ? 0.6 : 1 }}>
                            {generating === id ? "Generating...`" : `Generate ${ext}`}
                        </button>
                    </div>
                ))}
            </div>

            {error && <div style={{ marginBottom: 24, padding: "12px 16px", background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.25)", borderRadius: 10, fontSize: 13, color: "#FF4D6A" }}>⚠️ {error}</div>}

            {/* Past reports */}
            {reports.length > 0 && (
                <div className="anim-fade-up delay-2">
                    <div style={{ fontSize: 11, color: "#3D5278", fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>Generated Reports</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {reports.map((r, i) => {
                            const isPDF = r.report_type === "pdf";
                            const color = isPDF ? "#FF4D6A" : "#00FF94";
                            const Icon = isPDF ? FileText : Table;
                            return (
                                <div key={i} className="anim-fade-up" style={{ padding: "14px 18px", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, animationDelay: `${i * 60}ms` }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Icon size={17} color={color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#EEF2FF", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{r.file_name}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#3D5278" }}>
                                            <Clock size={10} />{fmtDate(r.created_at)}
                                            <span style={{ color: "rgba(0,212,255,0.15)" }}>·</span>
                                            <span style={{ color, fontWeight: 500 }}>{r.report_type?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <CheckCircle size={14} color="#00FF94" />
                                        <a href={api.getDownloadURL(r.file_name)} target="_blank" rel="noreferrer" style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, background: "linear-gradient(135deg,#00D4FF,#0099CC)", color: "#020812", borderRadius: 8, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                                            <FileDown size={12} />Download<ExternalLink size={10} />
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