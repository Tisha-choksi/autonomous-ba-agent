"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, Globe, FileText, Database, Loader2, CheckCircle, AlertCircle, ArrowRight, Brain, Zap, BarChart3, Sparkles, TrendingUp } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";

type Tab = "file" | "paste" | "url" | "sqlite";

const TABS = [
    { id: "file" as Tab, icon: Upload, label: "Upload File", hint: "CSV · XLSX · JSON" },
    { id: "paste" as Tab, icon: FileText, label: "Paste Data", hint: "CSV or JSON text" },
    { id: "url" as Tab, icon: Globe, label: "URL / Scrape", hint: "Web or API" },
    { id: "sqlite" as Tab, icon: Database, label: "SQLite DB", hint: ".db file" },
];
const FEATURES = [
    { icon: BarChart3, label: "Auto Dashboard", desc: "KPIs & charts instantly" },
    { icon: Brain, label: "AI Agent", desc: "11 specialized tools" },
    { icon: Zap, label: "NL Queries", desc: "Ask in plain English" },
    { icon: TrendingUp, label: "Forecast", desc: "Time-series prediction" },
    { icon: Sparkles, label: "Insights", desc: "Auto-discovered patterns" },
];

const inp: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: 10, color: "#EEF2FF", outline: "none",
    fontFamily: "'DM Sans',sans-serif", fontSize: 13.5,
    padding: "10px 14px", width: "100%",
};
const btnP: React.CSSProperties = {
    padding: "12px", fontSize: 13.5, fontWeight: 600,
    background: "linear-gradient(135deg,#00D4FF,#0099CC)",
    color: "#020812", border: "none", borderRadius: 10,
    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
};

export default function HomePage() {
    const router = useRouter();
    const { uploadFile, setSession } = useSession();
    const [tab, setTab] = useState<Tab>("file");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<any>(null);
    const [pasteText, setPaste] = useState("");
    const [pasteFmt, setPasteFmt] = useState<"csv" | "json">("csv");
    const [pasteName, setPasteName] = useState("");
    const [urlInput, setUrl] = useState("");
    const [sqliteFile, setSqliteFile] = useState<File | null>(null);
    const [sqliteTables, setSqliteTables] = useState<any[]>([]);
    const [selTable, setSelTable] = useState("");

    const finish = (data: any) => {
        setSuccess(data);
        setSession({ id: data.session_id, file_name: data.file_name, rows: data.rows, columns: data.columns, column_names: data.column_names, columns_meta: data.columns_meta });
        setTimeout(() => router.push("/dashboard"), 2000);
    };

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
        catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    const handleURL = async () => {
        if (!urlInput.trim()) return;
        setLoading(true); setError(null);
        try { finish(await api.uploadFromURL(urlInput)); }
        catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    const handleSQLiteFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setSqliteFile(file); setSqliteTables([]); setSelTable("");
        try { const d = await api.uploadSQLite(file); setSqliteTables(d.available_tables || []); finish(d); }
        catch (ex: any) { setError(ex.message); }
    };
    const handleSQLiteLoad = async () => {
        if (!sqliteFile) return;
        setLoading(true); setError(null);
        try { finish(await api.uploadSQLite(sqliteFile, selTable || undefined)); }
        catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    if (success) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{ padding: "52px 60px", textAlign: "center", maxWidth: 420, width: "100%", background: "rgba(4,12,28,0.95)", border: "1px solid rgba(0,255,148,0.3)", borderRadius: 22, boxShadow: "0 0 80px rgba(0,255,148,0.08)" }}>
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(0,255,148,0.10)", border: "1px solid rgba(0,255,148,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
                    <CheckCircle size={36} color="#00FF94" />
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: "#EEF2FF", marginBottom: 8 }}>Data Loaded!</div>
                <div style={{ fontSize: 14, color: "#8BA3C7", marginBottom: 6 }}>{success.file_name}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#00D4FF", marginBottom: 28 }}>
                    {success.rows?.toLocaleString()} rows · {success.columns} columns
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "#3D5278" }}>
                    <Loader2 size={14} color="#00D4FF" style={{ animation: "spin 1s linear infinite" }} />
                    Redirecting to dashboard...
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px 48px" }}>

            {/* Hero */}
            <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 44, maxWidth: 600 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,212,255,0.09)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: 100, padding: "5px 18px 5px 8px", marginBottom: 26 }}>
                    <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#00D4FF,#7C5CFC)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Brain size={13} color="#020812" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 11.5, color: "#00D4FF", fontWeight: 600, letterSpacing: "0.06em" }}>AUTONOMOUS BUSINESS ANALYST AGENT</span>
                </div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 54, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#EEF2FF", marginBottom: 18 }}>
                    Drop Your Data.<br /><span className="text-gradient">Get Intelligence.</span>
                </h1>
                <p style={{ fontSize: 17, color: "#8BA3C7", lineHeight: 1.7, fontWeight: 300 }}>
                    Upload any dataset and the AI agent analyzes it instantly — KPIs, charts, forecasts, segments, and natural language Q&A.
                </p>
            </div>

            {/* Feature pills */}
            <div className="anim-fade-up delay-2" style={{ display: "flex", gap: 10, marginBottom: 44, flexWrap: "wrap", justifyContent: "center" }}>
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 11, padding: "9px 16px" }}>
                        <Icon size={15} color="#00D4FF" />
                        <div>
                            <div style={{ fontSize: 12.5, color: "#EEF2FF", fontWeight: 500 }}>{label}</div>
                            <div style={{ fontSize: 10.5, color: "#3D5278" }}>{desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Card */}
            <div className="anim-fade-up delay-3 anim-glow" style={{ width: "100%", maxWidth: 660 }}>
                <div style={{ background: "rgba(5,14,30,0.95)", border: "1px solid rgba(0,212,255,0.14)", borderRadius: 22, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)" }}>

                    {/* Tabs */}
                    <div style={{ display: "flex", borderBottom: "1px solid rgba(0,212,255,0.10)", background: "rgba(0,0,0,0.35)" }}>
                        {TABS.map(({ id, icon: Icon, label, hint }) => {
                            const on = tab === id;
                            return (
                                <button key={id} onClick={() => { setTab(id); setError(null); }} style={{ flex: 1, padding: "14px 6px", background: on ? "rgba(0,212,255,0.08)" : "transparent", border: "none", borderBottom: on ? "2px solid #00D4FF" : "2px solid transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.22s" }}>
                                    <Icon size={16} color={on ? "#00D4FF" : "#3D5278"} />
                                    <span style={{ fontSize: 12, fontWeight: on ? 600 : 400, color: on ? "#00D4FF" : "#3D5278", fontFamily: "'DM Sans',sans-serif" }}>{label}</span>
                                    <span style={{ fontSize: 9.5, color: "#3D5278" }}>{hint}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Body */}
                    <div style={{ padding: 30 }}>

                        {/* File */}
                        {tab === "file" && (
                            <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? "#00D4FF" : "rgba(0,212,255,0.18)"}`, borderRadius: 16, padding: "48px 28px", textAlign: "center", cursor: "pointer", background: isDragActive ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.01)", transition: "all 0.3s", position: "relative", overflow: "hidden" }}>
                                <input {...getInputProps()} />
                                {isDragActive && <div className="scan-line" />}
                                {loading ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                                        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Loader2 size={28} color="#00D4FF" style={{ animation: "spin 1s linear infinite" }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, color: "#EEF2FF", fontWeight: 500, marginBottom: 5 }}>Analyzing your data...</div>
                                            <div style={{ fontSize: 12.5, color: "#3D5278" }}>Running EDA · KPIs · AI insights</div>
                                        </div>
                                        <div className="progress-bar" style={{ width: "50%", marginTop: 4 }}><div className="progress-fill" style={{ width: "65%" }} /></div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ width: 68, height: 68, margin: "0 auto 20px", background: isDragActive ? "rgba(0,212,255,0.14)" : "rgba(255,255,255,0.05)", borderRadius: 18, border: `1px solid ${isDragActive ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", boxShadow: isDragActive ? "0 0 32px rgba(0,212,255,0.22)" : "none" }}>
                                            <Upload size={28} color={isDragActive ? "#00D4FF" : "#3D5278"} />
                                        </div>
                                        <div style={{ fontSize: 17, color: "#EEF2FF", fontWeight: 500, marginBottom: 7 }}>{isDragActive ? "Drop to analyze!" : "Drag & drop your file"}</div>
                                        <div style={{ fontSize: 13, color: "#3D5278", marginBottom: 22 }}>CSV · Excel (.xlsx/.xls) · JSON · up to 50MB</div>
                                        <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 22 }}>
                                            {[".CSV", ".XLSX", ".XLS", ".JSON"].map(f => (
                                                <span key={f} style={{ padding: "3px 11px", fontSize: 11, background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.18)", color: "#00D4FF", borderRadius: 100, fontFamily: "'JetBrains Mono',monospace" }}>{f}</span>
                                            ))}
                                        </div>
                                        <button style={{ padding: "11px 32px", fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg,#00D4FF,#0099CC)", color: "#020812", border: "none", borderRadius: 11, cursor: "pointer", boxShadow: "0 6px 24px rgba(0,212,255,0.28)" }}>Browse File</button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Paste */}
                        {tab === "paste" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <input value={pasteName} onChange={e => setPasteName(e.target.value)} placeholder="Dataset name (optional)" style={{ ...inp, flex: 1 }} />
                                    <select value={pasteFmt} onChange={e => setPasteFmt(e.target.value as any)} style={{ ...inp, width: "auto", cursor: "pointer", background: "rgba(255,255,255,0.06)" }}>
                                        <option value="csv">CSV</option>
                                        <option value="json">JSON</option>
                                    </select>
                                </div>
                                <textarea value={pasteText} onChange={e => setPaste(e.target.value)} placeholder={pasteFmt === "csv" ? "name,age,city\nAlice,30,Mumbai" : '[{"name":"Alice","age":30}]'} rows={9}
                                    style={{ ...inp, resize: "none", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.65, fontSize: 12.5 }} />
                                <button onClick={handlePaste} disabled={!pasteText.trim() || loading} style={{ ...btnP, opacity: (!pasteText.trim() || loading) ? 0.45 : 1 }}>
                                    {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={15} />}
                                    {loading ? "Analyzing..." : "Analyze Pasted Data"}
                                </button>
                            </div>
                        )}

                        {/* URL */}
                        {tab === "url" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div style={{ fontSize: 13, color: "#3D5278" }}>Direct file link or page with HTML tables / JSON API</div>
                                <input value={urlInput} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/data.csv" style={inp} />
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {["Direct CSV/JSON", "HTML Tables", "JSON APIs", "Excel URLs"].map(t => (
                                        <span key={t} style={{ padding: "3px 12px", fontSize: 11.5, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)", color: "#00D4FF", borderRadius: 100, fontWeight: 500 }}>{t}</span>
                                    ))}
                                </div>
                                <button onClick={handleURL} disabled={!urlInput.trim() || loading} style={{ ...btnP, opacity: (!urlInput.trim() || loading) ? 0.45 : 1 }}>
                                    {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Globe size={15} />}
                                    {loading ? "Scraping..." : "Scrape & Analyze"}
                                </button>
                            </div>
                        )}

                        {/* SQLite */}
                        {tab === "sqlite" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 24px", border: "2px dashed rgba(0,212,255,0.18)", borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.01)" }}>
                                    <input type="file" accept=".db" style={{ display: "none" }} onChange={handleSQLiteFile} />
                                    <Database size={38} color="#3D5278" />
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 15, color: "#EEF2FF", fontWeight: 500 }}>Select a .db file</div>
                                        <div style={{ fontSize: 12, color: "#3D5278", marginTop: 5 }}>SQLite database</div>
                                    </div>
                                </label>
                                {sqliteTables.length > 0 && <>
                                    <div style={{ fontSize: 12.5, color: "#3D5278" }}>{sqliteTables.length} table(s) found — select one:</div>
                                    {sqliteTables.map(t => (
                                        <button key={t.table} onClick={() => setSelTable(t.table)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: selTable === t.table ? "rgba(0,212,255,0.10)" : "rgba(255,255,255,0.03)", border: `1px solid ${selTable === t.table ? "rgba(0,212,255,0.35)" : "rgba(0,212,255,0.10)"}`, borderRadius: 9, cursor: "pointer" }}>
                                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: selTable === t.table ? "#00D4FF" : "#8BA3C7" }}>{t.table}</span>
                                            <span style={{ fontSize: 11, color: "#3D5278" }}>{t.rows?.toLocaleString()} rows</span>
                                        </button>
                                    ))}
                                    <button onClick={handleSQLiteLoad} disabled={!selTable || loading} style={{ ...btnP, opacity: (!selTable || loading) ? 0.45 : 1 }}>
                                        <Database size={15} /> Load Table
                                    </button>
                                </>}
                            </div>
                        )}

                        {error && (
                            <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.28)", borderRadius: 11, display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <AlertCircle size={15} color="#FF4D6A" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontSize: 13, color: "#FF4D6A" }}>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom badges */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
                    {[".CSV", ".XLSX", ".XLS", ".JSON", "Paste", "URL", "SQLite"].map(f => (
                        <span key={f} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 100, padding: "4px 13px", fontSize: 11, color: "#3D5278", fontFamily: "'JetBrains Mono',monospace" }}>{f}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}