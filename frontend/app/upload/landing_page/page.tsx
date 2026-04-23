"use client";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  Upload, Link, Database, FileText, Loader2,
  CheckCircle, AlertCircle, ChevronRight,
  Zap, BarChart3, Brain, Sparkles, ArrowRight,
  FileSpreadsheet, Globe
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";

type SourceTab = "file" | "paste" | "url" | "sqlite";

const TABS: { id: SourceTab; icon: any; label: string; hint: string }[] = [
  { id: "file", icon: Upload, label: "Upload File", hint: "CSV · XLSX · JSON" },
  { id: "paste", icon: FileText, label: "Paste Data", hint: "CSV or JSON text" },
  { id: "url", icon: Globe, label: "Web / URL", hint: "Scrape or API" },
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
  const [mounted, setMounted] = useState(false);

  const [pasteText, setPasteText] = useState("");
  const [pasteFmt, setPasteFmt] = useState<"csv" | "json">("csv");
  const [pasteName, setPasteName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [sqliteFile, setSqliteFile] = useState<File | null>(null);
  const [sqliteTables, setSqliteTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const handleSuccess = (data: any) => {
    setSuccess(data);
    setSession({
      id: data.session_id, file_name: data.file_name,
      rows: data.rows, columns: data.columns,
      column_names: data.column_names, columns_meta: data.columns_meta,
    });
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setLoading(true); setError(null);
    try { handleSuccess(await uploadFile(accepted[0])); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/json": [".json"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const handlePaste = async () => {
    if (!pasteText.trim()) return;
    setLoading(true); setError(null);
    try { handleSuccess(await api.uploadPaste(pasteText, pasteFmt, pasteName || "pasted_data")); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleURL = async () => {
    if (!urlInput.trim()) return;
    setLoading(true); setError(null);
    try { handleSuccess(await api.uploadFromURL(urlInput)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSQLiteFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSqliteFile(file); setSqliteTables([]); setSelectedTable("");
    try {
      const data = await api.uploadSQLite(file);
      setSqliteTables(data.available_tables || []);
      handleSuccess(data);
    } catch (ex: any) { setError(ex.message); }
  };

  const handleSQLiteLoad = async () => {
    if (!sqliteFile) return;
    setLoading(true); setError(null);
    try { handleSuccess(await api.uploadSQLite(sqliteFile, selectedTable || undefined)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (!mounted) return null;

  if (success) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 32,
    }}>
      <div className="glass-card anim-scale-in" style={{
        padding: "48px 56px", textAlign: "center", maxWidth: 440,
        border: "1px solid rgba(0, 255, 148, 0.3)",
        boxShadow: "0 0 60px rgba(0, 255, 148, 0.08)",
      }}>
        <div style={{
          width: 72, height: 72,
          background: "linear-gradient(135deg, rgba(0,255,148,0.2), rgba(0,212,255,0.1))",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          border: "1px solid rgba(0,255,148,0.3)",
        }}>
          <CheckCircle size={34} color="var(--green)" />
        </div>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: 22, fontWeight: 700,
          color: "var(--text-primary)", marginBottom: 8,
        }}>
          Data Loaded!
        </h3>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 6 }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{success.file_name}</span>
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--cyan)", marginBottom: 24 }}>
          {success.rows?.toLocaleString()} rows · {success.columns} columns
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Redirecting to dashboard...
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", position: "relative", padding: "60px 32px 40px" }}>

      {/* Hero */}
      <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--cyan-dim)",
          border: "1px solid rgba(0, 212, 255, 0.2)",
          borderRadius: 100, padding: "5px 14px 5px 8px",
          marginBottom: 24,
          animation: "fadeIn 0.6s ease",
        }}>
          <div style={{
            width: 20, height: 20,
            background: "linear-gradient(135deg, var(--cyan), var(--purple))",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={11} color="#020812" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 12, color: "var(--cyan)", fontWeight: 500, letterSpacing: "0.04em" }}>
            AUTONOMOUS BUSINESS ANALYST AGENT
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: 52, fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          color: "var(--text-primary)",
          marginBottom: 16,
        }}>
          Drop Your Data.
          <br />
          <span className="text-gradient">Get Intelligence.</span>
        </h1>

        <p style={{
          fontSize: 16, color: "var(--text-secondary)",
          maxWidth: 520, margin: "0 auto 0",
          lineHeight: 1.65,
          fontWeight: 300,
        }}>
          Upload any dataset and the AI agent analyzes it instantly —
          KPIs, charts, forecasts, segments, and natural language Q&A.
        </p>
      </div>

      {/* Features row */}
      <div className="anim-fade-up delay-2" style={{
        display: "flex", gap: 12, justifyContent: "center",
        marginBottom: 44, flexWrap: "wrap",
      }}>
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
            borderRadius: 10, padding: "8px 14px",
          }}>
            <Icon size={14} color="var(--cyan)" />
            <div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Card */}
      <div className="anim-fade-up delay-3" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>

          {/* Tab Bar */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            background: "rgba(0,0,0,0.2)",
          }}>
            {TABS.map(({ id, icon: Icon, label, hint }) => (
              <button key={id}
                onClick={() => { setTab(id); setError(null); }}
                style={{
                  flex: 1, padding: "13px 8px",
                  background: tab === id ? "rgba(0,212,255,0.06)" : "transparent",
                  border: "none",
                  borderBottom: tab === id ? "2px solid var(--cyan)" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}>
                <Icon size={15} color={tab === id ? "var(--cyan)" : "var(--text-muted)"} />
                <span style={{
                  fontSize: 12, fontWeight: tab === id ? 500 : 400,
                  color: tab === id ? "var(--cyan)" : "var(--text-muted)",
                }}>{label}</span>
                <span style={{ fontSize: 9.5, color: "var(--text-muted)" }}>{hint}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: 28 }}>

            {/* ── File Drop ── */}
            {tab === "file" && (
              <div {...getRootProps()} style={{
                border: `2px dashed ${isDragActive ? "var(--cyan)" : "var(--border)"}`,
                borderRadius: 14,
                padding: "44px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: isDragActive ? "rgba(0,212,255,0.05)" : "transparent",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}>
                {isDragActive && (
                  <div className="scan-line" />
                )}
                <input {...getInputProps()} />
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 56, height: 56,
                      background: "var(--cyan-dim)",
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Loader2 size={26} color="var(--cyan)"
                        style={{ animation: "spin 1s linear infinite" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 500, marginBottom: 4 }}>
                        Analyzing your data...
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Running EDA, KPIs, and insights
                      </div>
                    </div>
                    <div className="progress-bar" style={{ width: "60%", margin: "4px auto 0" }}>
                      <div className="progress-fill" style={{ width: "70%" }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: 60, height: 60,
                      background: isDragActive ? "var(--cyan-dim)" : "rgba(255,255,255,0.04)",
                      borderRadius: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 18px",
                      border: "1px solid var(--border)",
                      transition: "all 0.3s ease",
                      boxShadow: isDragActive ? "0 0 30px rgba(0,212,255,0.2)" : "none",
                    }}>
                      <Upload size={26} color={isDragActive ? "var(--cyan)" : "var(--text-muted)"} />
                    </div>
                    <div style={{ fontSize: 16, color: "var(--text-primary)", fontWeight: 500, marginBottom: 6 }}>
                      {isDragActive ? "Drop to analyze!" : "Drag & drop your file"}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 20 }}>
                      CSV · Excel (.xlsx / .xls) · JSON · up to 50MB
                    </div>
                    <button className="btn-primary" style={{ padding: "9px 24px", fontSize: 13 }}>
                      Browse File
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Paste ── */}
            {tab === "paste" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    className="input-field"
                    value={pasteName}
                    onChange={e => setPasteName(e.target.value)}
                    placeholder="Dataset name (optional)"
                    style={{ flex: 1, padding: "9px 12px", fontSize: 13 }}
                  />
                  <select
                    value={pasteFmt}
                    onChange={e => setPasteFmt(e.target.value as any)}
                    className="input-field"
                    style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer" }}>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <textarea
                  className="input-field"
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={pasteFmt === "csv"
                    ? "name,age,city\nAlice,30,Mumbai\nBob,25,Delhi"
                    : '[{"name":"Alice","age":30},{"name":"Bob","age":25}]'}
                  rows={9}
                  style={{
                    padding: "12px 14px", fontSize: 12.5, resize: "none",
                    fontFamily: "var(--font-mono)", lineHeight: 1.6,
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={handlePaste}
                  disabled={!pasteText.trim() || loading}
                  style={{ padding: "11px", fontSize: 13, opacity: (!pasteText.trim() || loading) ? 0.5 : 1 }}>
                  {loading
                    ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Analyzing...
                    </span>
                    : <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <ArrowRight size={14} /> Analyze Pasted Data
                    </span>
                  }
                </button>
              </div>
            )}

            {/* ── URL ── */}
            {tab === "url" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                    Enter a direct link or a webpage with tabular data
                  </div>
                  <input
                    className="input-field"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/data.csv"
                    style={{ width: "100%", padding: "10px 14px", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Direct CSV/JSON", "HTML Tables", "JSON REST APIs", "Excel URLs"].map(t => (
                    <span key={t} className="badge badge-cyan" style={{ fontSize: 10.5 }}>{t}</span>
                  ))}
                </div>
                <button
                  className="btn-primary"
                  onClick={handleURL}
                  disabled={!urlInput.trim() || loading}
                  style={{ padding: "11px", fontSize: 13, opacity: (!urlInput.trim() || loading) ? 0.5 : 1 }}>
                  {loading
                    ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Scraping...
                    </span>
                    : <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <Globe size={14} /> Scrape & Analyze
                    </span>
                  }
                </button>
              </div>
            )}

            {/* ── SQLite ── */}
            {tab === "sqlite" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 12, padding: 32,
                  border: "2px dashed var(--border)",
                  borderRadius: 12, cursor: "pointer",
                  transition: "all 0.3s ease",
                }}>
                  <input type="file" accept=".db" style={{ display: "none" }} onChange={handleSQLiteFile} />
                  <Database size={32} color="var(--text-muted)" />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
                      Select a .db file
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      SQLite database
                    </div>
                  </div>
                </label>
                {sqliteTables.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {sqliteTables.length} table(s) found — select one:
                    </div>
                    {sqliteTables.map(t => (
                      <button key={t.table}
                        onClick={() => setSelectedTable(t.table)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 14px",
                          background: selectedTable === t.table ? "var(--cyan-dim)" : "var(--bg-glass)",
                          border: `1px solid ${selectedTable === t.table ? "rgba(0,212,255,0.4)" : "var(--border)"}`,
                          borderRadius: 8, cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: 13,
                          color: selectedTable === t.table ? "var(--cyan)" : "var(--text-secondary)",
                        }}>{t.table}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {t.rows?.toLocaleString()} rows · {t.columns} cols
                        </span>
                      </button>
                    ))}
                    <button
                      className="btn-primary"
                      onClick={handleSQLiteLoad}
                      disabled={!selectedTable || loading}
                      style={{ padding: "11px", fontSize: 13, opacity: (!selectedTable || loading) ? 0.5 : 1 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                        <Database size={14} /> Load Table
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 14,
                display: "flex", alignItems: "flex-start", gap: 10,
                background: "var(--red-dim)",
                border: "1px solid rgba(255,77,106,0.25)",
                borderRadius: 10, padding: "10px 14px",
                animation: "fadeIn 0.3s ease",
              }}>
                <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "var(--red)" }}>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Format badges */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap",
        }}>
          {[".CSV", ".XLSX", ".XLS", ".JSON", "Paste", "URL", "SQLite"].map(f => (
            <span key={f} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 100, padding: "4px 12px",
              fontSize: 11, color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}>
              <FileSpreadsheet size={10} />
              {f}
            </span>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}