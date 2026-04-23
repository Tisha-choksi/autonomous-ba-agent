"use client";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
    Upload, Globe, FileText, Database,
    Loader2, CheckCircle, AlertCircle,
    ArrowRight, Brain, Zap, BarChart3, Sparkles
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";

/* ── Color tokens (hardcoded — no CSS variables needed) ── */
const C = {
    cyan: "#00D4FF",
    cyanDim: "rgba(0,212,255,0.10)",
    cyanBorder: "rgba(0,212,255,0.22)",
    purple: "#7C5CFC",
    purpleDim: "rgba(124,92,252,0.10)",
    green: "#00FF94",
    greenDim: "rgba(0,255,148,0.09)",
    greenBorder: "rgba(0,255,148,0.25)",
    red: "#FF4D6A",
    redDim: "rgba(255,77,106,0.09)",
    card: "rgba(8,18,38,0.85)",
    cardHover: "rgba(12,26,52,0.95)",
    border: "rgba(0,212,255,0.09)",
    borderHover: "rgba(0,212,255,0.26)",
    text: "#EEF2FF",
    secondary: "#8BA3C7",
    muted: "#3D5278",
    mono: "'JetBrains Mono', monospace",
    display: "'Syne', sans-serif",
    body: "'DM Sans', sans-serif",
};

type SourceTab = "file" | "paste" | "url" | "sqlite";

const TABS: { id: SourceTab; icon: any; label: string; hint: string }[] = [
    { id: "file", icon: Upload, label: "Upload File", hint: "CSV · XLSX · JSON" },
    { id: "paste", icon: FileText, label: "Paste Data", hint: "CSV or JSON text" },
    { id: "url", icon: Globe, label: "URL / Scrape", hint: "Web or API" },
    { id: "sqlite", icon: Database, label: "SQLite DB", hint: ".db file" },
];

const FEATURES = [
    { icon: BarChart3, label: "Auto Dashboard", desc: "KPIs & charts instantly" },
    { icon: Brain, label: "AI Agent", desc: "11 specialized tools" },
    { icon: Zap, label: "NL Queries", desc: "Ask in plain English" },
    { icon: Sparkles, label: "Insights", desc: "Auto-discovered patterns" },
];

export default function HomePage() {
    const router = useRouter();
    const { uploadFile, setSession } = useSession();
    const [tab, setTab] = useState<SourceTab>("file");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<any>(null);
    const [pasteText, setPasteText] = useState("");
    const [pasteFmt, setPasteFmt] = useState<"csv" | "json">("csv");
    const [pasteName, setPasteName] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [sqliteTables, setSqliteTables] = useState<any[]>([]);
    const [sqliteFile, setSqliteFile] = useState<File | null>(null);
    const [selectedTable, setSelectedTable] = useState("");

    const finish = (data: any) => {
        setSuccess(data);
        setSession({ id: data.session_id, file_name: data.file_name, rows: data.rows, columns: data.columns, column_names: data.column_names, columns_meta: data.columns_meta });
        setTimeout(() => router.push("/dashboard"), 2000);
    };

    /* Drop */
    const onDrop = useCallback(async (files: File[]) => {
        if (!files.length) return;
        setLoading(true); setError(null);
        try { finish(await uploadFile(files[0])); }
        catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }, [uploadFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "text/csv": [".csv"], "application/json": [".json"], "application/vnd.ms-excel": [".xls"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
        maxFiles: 1,
    });

    const handlePaste = async () => {
        if (!pasteText.trim()) return;
        setLoading(true); setError(null);
        try { finish(await api.uploadPaste(pasteText, pasteFmt, pasteName || "pasted_data")); }
        catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleURL = async () => {
        if (!urlInput.trim()) return;
        setLoading(true); setError(null);
        try { finish(await api.uploadFromURL(urlInput)); }
        catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleSQLiteFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setSqliteFile(file); setSqliteTables([]); setSelectedTable("");
        try { const d = await api.uploadSQLite(file); setSqliteTables(d.available_tables || []); finish(d); }
        catch (ex: any) { setError(ex.message); }
    };

    const handleSQLiteLoad = async () => {
        if (!sqliteFile) return;
        setLoading(true); setError(null);
        try { finish(await api.uploadSQLite(sqliteFile, selectedTable || undefined)); }
        catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    /* Success screen */
    if (success) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{
                padding: "52px 60px", textAlign: "center", maxWidth: 420, width: "100%",
                background: C.card, border: `1px solid ${C.greenBorder}`,
                borderRadius: 20, boxShadow: "0 0 60px rgba(0,255,148,0.08)",
            }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.greenDim, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <CheckCircle size={36} color={C.green} />
                </div>
                <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Data Loaded!</div>
                <div style={{ fontSize: 14, color: C.secondary, marginBottom: 6 }}>{success.file_name}</div>
                <div style={{ fontFamily: C.mono, fontSize: 12, color: C.cyan, marginBottom: 24 }}>
                    {success.rows?.toLocaleString()} rows · {success.columns} columns
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: C.muted }}>
                    <Loader2 size={14} color={C.cyan} style={{ animation: "spin 1s linear infinite" }} />
                    Redirecting to dashboard...
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", padding: "56px 32px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>

            {/* ── Hero ── */}
            <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 48, maxWidth: 580 }}>
                {/* Badge */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
                    borderRadius: 100, padding: "5px 16px 5px 8px", marginBottom: 24,
                }}>
                    <div style={{ width: 22, height: 22, background: "linear-gradient(135deg, #00D4FF, #7C5CFC)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Brain size={12} color="#020812" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 11.5, color: C.cyan, fontWeight: 500, letterSpacing: "0.05em" }}>
                        AUTONOMOUS BUSINESS ANALYST AGENT
                    </span>
                </div>

                <h1 style={{
                    fontFamily: C.display,
                    fontSize: 52, fontWeight: 800,
                    lineHeight: 1.06, letterSpacing: "-0.025em",
                    color: C.text, marginBottom: 18,
                }}>
                    Drop Your Data.<br />
                    <span className="text-gradient">Get Intelligence.</span>
                </h1>

                <p style={{ fontSize: 16, color: C.secondary, lineHeight: 1.7, fontWeight: 300 }}>
                    Upload any dataset and the AI agent analyzes it instantly —
                    KPIs, charts, forecasts, segments, and natural language Q&A.
                </p>
            </div>

            {/* ── Feature pills ── */}
            <div className="anim-fade-up delay-2" style={{ display: "flex", gap: 10, marginBottom: 40, flexWrap: "wrap", justifyContent: "center" }}>
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} style={{
                        display: "flex", alignItems: "center", gap: 9,
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: "8px 14px",
                    }}>
                        <Icon size={14} color={C.cyan} />
                        <div>
                            <div style={{ fontSize: 12.5, color: C.text, fontWeight: 500 }}>{label}</div>
                            <div style={{ fontSize: 10.5, color: C.muted }}>{desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main card ── */}
            <div className="anim-fade-up delay-3" style={{ width: "100%", maxWidth: 640 }}>
                <div style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20, overflow: "hidden",
                }}>

                    {/* Tab bar */}
                    <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: "rgba(0,0,0,0.3)" }}>
                        {TABS.map(({ id, icon: Icon, label, hint }) => {
                            const active = tab === id;
                            return (
                                <button key={id} onClick={() => { setTab(id); setError(null); }}
                                    style={{
                                        flex: 1, padding: "14px 8px",
                                        background: active ? "rgba(0,212,255,0.07)" : "transparent",
                                        border: "none",
                                        borderBottom: active ? `2px solid ${C.cyan}` : "2px solid transparent",
                                        cursor: "pointer",
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                        transition: "all 0.2s ease",
                                    }}>
                                    <Icon size={16} color={active ? C.cyan : C.muted} />
                                    <span style={{ fontSize: 12, fontWeight: active ? 500 : 400, color: active ? C.cyan : C.muted }}>
                                        {label}
                                    </span>
                                    <span style={{ fontSize: 9.5, color: C.muted }}>{hint}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab body */}
                    <div style={{ padding: 28 }}>

                        {/* ── File drop ── */}
                        {tab === "file" && (
                            <div {...getRootProps()} style={{
                                border: `2px dashed ${isDragActive ? C.cyan : "rgba(0,212,255,0.18)"}`,
                                borderRadius: 14, padding: "44px 28px", textAlign: "center", cursor: "pointer",
                                background: isDragActive ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.01)",
                                transition: "all 0.3s ease",
                                position: "relative", overflow: "hidden",
                            }}>
                                <input {...getInputProps()} />
                                {isDragActive && <div className="scan-line" />}

                                {loading ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                                        <div style={{ width: 56, height: 56, background: C.cyanDim, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Loader2 size={26} color={C.cyan} style={{ animation: "spin 1s linear infinite" }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, color: C.text, fontWeight: 500, marginBottom: 4 }}>Analyzing your data...</div>
                                            <div style={{ fontSize: 12, color: C.muted }}>Running EDA, KPIs, and AI insights</div>
                                        </div>
                                        <div className="progress-bar" style={{ width: "55%", marginTop: 4 }}>
                                            <div className="progress-fill" style={{ width: "65%" }} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            width: 62, height: 62, margin: "0 auto 18px",
                                            background: isDragActive ? C.cyanDim : "rgba(255,255,255,0.05)",
                                            borderRadius: 16,
                                            border: `1px solid ${isDragActive ? C.cyanBorder : "rgba(255,255,255,0.06)"}`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.3s ease",
                                            boxShadow: isDragActive ? "0 0 30px rgba(0,212,255,0.25)" : "none",
                                        }}>
                                            <Upload size={26} color={isDragActive ? C.cyan : C.muted} />
                                        </div>
                                        <div style={{ fontSize: 16, color: C.text, fontWeight: 500, marginBottom: 6 }}>
                                            {isDragActive ? "Drop to analyze!" : "Drag & drop your file"}
                                        </div>
                                        <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>
                                            CSV · Excel (.xlsx/.xls) · JSON · up to 50MB
                                        </div>
                                        <button style={{
                                            padding: "10px 28px", fontSize: 13.5, fontWeight: 600,
                                            background: "linear-gradient(135deg, #00D4FF, #0099CC)",
                                            color: "#020812", border: "none", borderRadius: 10,
                                            cursor: "pointer", fontFamily: C.body,
                                        }}>
                                            Browse File
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── Paste ── */}
                        {tab === "paste" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <input
                                        value={pasteName} onChange={e => setPasteName(e.target.value)}
                                        placeholder="Dataset name (optional)"
                                        style={{ flex: 1, padding: "9px 12px", fontSize: 13, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, outline: "none", fontFamily: C.body }}
                                    />
                                    <select value={pasteFmt} onChange={e => setPasteFmt(e.target.value as any)}
                                        style={{ padding: "9px 12px", fontSize: 13, background: "#060f1e", border: `1px solid ${C.border}`, borderRadius: 10, color: C.secondary, outline: "none", cursor: "pointer" }}>
                                        <option value="csv">CSV</option>
                                        <option value="json">JSON</option>
                                    </select>
                                </div>
                                <textarea
                                    value={pasteText} onChange={e => setPasteText(e.target.value)}
                                    placeholder={pasteFmt === "csv" ? "name,age,city\nAlice,30,Mumbai\nBob,25,Delhi" : '[{"name":"Alice","age":30}]'}
                                    rows={9}
                                    style={{
                                        width: "100%", padding: "12px 14px", fontSize: 12.5,
                                        background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                                        borderRadius: 12, color: C.secondary, outline: "none", resize: "none",
                                        fontFamily: C.mono, lineHeight: 1.65,
                                    }}
                                />
                                <button onClick={handlePaste} disabled={!pasteText.trim() || loading}
                                    style={{
                                        padding: "12px", fontSize: 13.5, fontWeight: 600,
                                        background: "linear-gradient(135deg, #00D4FF, #0099CC)",
                                        color: "#020812", border: "none", borderRadius: 10, cursor: "pointer",
                                        opacity: (!pasteText.trim() || loading) ? 0.45 : 1,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    }}>
                                    {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={15} />}
                                    {loading ? "Analyzing..." : "Analyze Pasted Data"}
                                </button>
                            </div>
                        )}

                        {/* ── URL ── */}
                        {tab === "url" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div style={{ fontSize: 12.5, color: C.muted }}>
                                    Enter a direct file link or a page with tables / JSON API
                                </div>
                                <input
                                    value={urlInput} onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/data.csv"
                                    style={{ padding: "11px 14px", fontSize: 13.5, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, outline: "none", fontFamily: C.body, width: "100%" }}
                                />
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {["Direct CSV / JSON", "HTML Tables", "JSON REST APIs", "Excel URLs"].map(t => (
                                        <span key={t} style={{ padding: "3px 10px", fontSize: 11, background: C.cyanDim, border: `1px solid ${C.cyanBorder}`, color: C.cyan, borderRadius: 100, fontWeight: 500 }}>{t}</span>
                                    ))}
                                </div>
                                <button onClick={handleURL} disabled={!urlInput.trim() || loading}
                                    style={{
                                        padding: "12px", fontSize: 13.5, fontWeight: 600,
                                        background: "linear-gradient(135deg, #00D4FF, #0099CC)",
                                        color: "#020812", border: "none", borderRadius: 10, cursor: "pointer",
                                        opacity: (!urlInput.trim() || loading) ? 0.45 : 1,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    }}>
                                    {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Globe size={15} />}
                                    {loading ? "Scraping..." : "Scrape & Analyze"}
                                </button>
                            </div>
                        )}

                        {/* ── SQLite ── */}
                        {tab === "sqlite" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "36px 24px", border: `2px dashed rgba(0,212,255,0.18)`, borderRadius: 14, cursor: "pointer" }}>
                                    <input type="file" accept=".db" style={{ display: "none" }} onChange={handleSQLiteFile} />
                                    <Database size={36} color={C.muted} />
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>Select a .db file</div>
                                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>SQLite database</div>
                                    </div>
                                </label>
                                {sqliteTables.length > 0 && (
                                    <>
                                        <div style={{ fontSize: 12, color: C.muted }}>{sqliteTables.length} table(s) found — select one:</div>
                                        {sqliteTables.map(t => (
                                            <button key={t.table} onClick={() => setSelectedTable(t.table)}
                                                style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "11px 14px",
                                                    background: selectedTable === t.table ? C.cyanDim : "rgba(255,255,255,0.02)",
                                                    border: `1px solid ${selectedTable === t.table ? C.cyanBorder : C.border}`,
                                                    borderRadius: 9, cursor: "pointer",
                                                }}>
                                                <span style={{ fontFamily: C.mono, fontSize: 13, color: selectedTable === t.table ? C.cyan : C.secondary }}>{t.table}</span>
                                                <span style={{ fontSize: 11, color: C.muted }}>{t.rows?.toLocaleString()} rows</span>
                                            </button>
                                        ))}
                                        <button onClick={handleSQLiteLoad} disabled={!selectedTable || loading}
                                            style={{
                                                padding: "12px", fontSize: 13.5, fontWeight: 600,
                                                background: "linear-gradient(135deg, #00D4FF, #0099CC)",
                                                color: "#020812", border: "none", borderRadius: 10, cursor: "pointer",
                                                opacity: (!selectedTable || loading) ? 0.45 : 1,
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                            }}>
                                            <Database size={15} /> Load Table
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div style={{
                                marginTop: 14, padding: "11px 14px",
                                background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.25)",
                                borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 9,
                            }}>
                                <AlertCircle size={15} color="#FF4D6A" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontSize: 13, color: "#FF4D6A" }}>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Format badges row */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
                    {[".CSV", ".XLSX", ".XLS", ".JSON", "Paste", "URL", "SQLite"].map(f => (
                        <span key={f} style={{
                            background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                            borderRadius: 100, padding: "4px 13px",
                            fontSize: 11, color: C.muted, fontFamily: C.mono,
                        }}>
                            {f}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}