"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
    Upload, Link, Database, FileText, Loader2,
    CheckCircle, AlertCircle, ChevronRight, Brain
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";

type SourceTab = "file" | "paste" | "url" | "sqlite";

const TABS: { id: SourceTab; icon: any; label: string; desc: string }[] = [
    { id: "file", icon: Upload, label: "File Upload", desc: "CSV · Excel · JSON" },
    { id: "paste", icon: FileText, label: "Paste Data", desc: "CSV or JSON text" },
    { id: "url", icon: Link, label: "URL / Scrape", desc: "Web page or API" },
    { id: "sqlite", icon: Database, label: "SQLite DB", desc: ".db file" },
];

export default function HomePage() {
    const router = useRouter();
    const { uploadFile, setSession } = useSession();
    const [tab, setTab] = useState<SourceTab>("file");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<any>(null);

    // Paste state
    const [pasteText, setPasteText] = useState("");
    const [pasteFmt, setPasteFmt] = useState<"csv" | "json">("csv");
    const [pasteName, setPasteName] = useState("");

    // URL state
    const [urlInput, setUrlInput] = useState("");

    // SQLite state
    const [sqliteFile, setSqliteFile] = useState<File | null>(null);
    const [sqliteTables, setSqliteTables] = useState<any[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>("");

    const handleSuccess = (data: any) => {
        setSuccess(data);
        const session = {
            id: data.session_id, file_name: data.file_name,
            rows: data.rows, columns: data.columns,
            column_names: data.column_names, columns_meta: data.columns_meta
        };
        setSession(session);
        setTimeout(() => router.push("/dashboard"), 1500);
    };

    // File drop
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
            "text/csv": [".csv"], "application/json": [".json"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        },
        maxFiles: 1
    });

    // Paste submit
    const handlePaste = async () => {
        if (!pasteText.trim()) return;
        setLoading(true); setError(null);
        try { handleSuccess(await api.uploadPaste(pasteText, pasteFmt, pasteName || "pasted_data")); }
        catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    // URL submit
    const handleURL = async () => {
        if (!urlInput.trim()) return;
        setLoading(true); setError(null);
        try { handleSuccess(await api.uploadFromURL(urlInput)); }
        catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    // SQLite: preview tables on file select
    const handleSQLiteFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSqliteFile(file); setSqliteTables([]); setSelectedTable("");
        try {
            const data = await api.uploadSQLite(file); // upload + auto-load largest table
            setSqliteTables(data.available_tables || []);
            handleSuccess(data);
        } catch (ex: any) {
            setError(ex.message);
        }
    };

    const handleSQLiteLoad = async () => {
        if (!sqliteFile) return;
        setLoading(true); setError(null);
        try { handleSuccess(await api.uploadSQLite(sqliteFile, selectedTable || undefined)); }
        catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    if (success) return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="bg-slate-900 border border-green-800/50 rounded-2xl p-10 text-center max-w-md w-full">
                <CheckCircle size={52} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Loaded Successfully!</h3>
                <p className="text-slate-400 mb-1 font-medium text-white">{success.file_name}</p>
                <p className="text-slate-400 text-sm mb-6">
                    {success.rows?.toLocaleString()} rows · {success.columns} columns
                </p>
                <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Redirecting to dashboard...
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            {/* Hero */}
            <div className="text-center mb-10">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Brain size={28} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">
                    Autonomous Business<br />
                    <span className="text-blue-400">Analyst Agent</span>
                </h1>
                <p className="text-slate-400 max-w-md mx-auto">
                    Load your data from any source. The AI agent analyzes it instantly —
                    insights, charts, forecasts, and natural language Q&A.
                </p>
            </div>

            {/* Source Tabs */}
            <div className="w-full max-w-2xl">
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {TABS.map(({ id, icon: Icon, label, desc }) => (
                        <button key={id} onClick={() => { setTab(id); setError(null); }}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${tab === id
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"
                                }`}>
                            <Icon size={18} />
                            <span className="font-medium">{label}</span>
                            <span className={`${tab === id ? "text-blue-200" : "text-slate-500"} text-[10px]`}>{desc}</span>
                        </button>
                    ))}
                </div>

                {/* ── File Upload ── */}
                {tab === "file" && (
                    <div {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${isDragActive ? "border-blue-500 bg-blue-950/30" : "border-slate-700 hover:border-slate-500 bg-slate-900/50"
                            }`}>
                        <input {...getInputProps()} />
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={36} className="text-blue-400 animate-spin" />
                                <p className="text-slate-300">Analyzing your data...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <Upload size={36} className="text-slate-500" />
                                <div>
                                    <p className="text-white font-medium">{isDragActive ? "Drop it!" : "Drag & drop your file"}</p>
                                    <p className="text-slate-500 text-sm mt-1">CSV · Excel (.xlsx/.xls) · JSON · Max 50MB</p>
                                </div>
                                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                                    Browse File
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Paste Raw Data ── */}
                {tab === "paste" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div className="flex gap-3">
                            <input value={pasteName} onChange={e => setPasteName(e.target.value)}
                                placeholder="Dataset name (optional)"
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                            <select value={pasteFmt} onChange={e => setPasteFmt(e.target.value as any)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>
                        <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                            placeholder={pasteFmt === "csv"
                                ? "name,age,city\nAlice,30,Mumbai\nBob,25,Delhi"
                                : '[{"name":"Alice","age":30},{"name":"Bob","age":25}]'}
                            rows={10}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <button onClick={handlePaste} disabled={!pasteText.trim() || loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                            Analyze Pasted Data
                        </button>
                    </div>
                )}

                {/* ── URL / Scrape ── */}
                {tab === "url" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Enter a URL to scrape or a direct file link</label>
                            <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                                placeholder="https://example.com/data.csv  or  https://api.example.com/data"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                            {["Direct .csv / .json / .xlsx links", "Pages with HTML tables", "JSON REST APIs"].map(t => (
                                <div key={t} className="bg-slate-800/50 rounded-lg p-2 text-center">{t}</div>
                            ))}
                        </div>
                        <button onClick={handleURL} disabled={!urlInput.trim() || loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
                            {loading ? "Scraping..." : "Scrape & Analyze"}
                        </button>
                    </div>
                )}

                {/* ── SQLite DB File ── */}
                {tab === "sqlite" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <label className="block border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-8 text-center cursor-pointer transition-colors">
                            <input type="file" accept=".db" className="hidden" onChange={handleSQLiteFile} />
                            <Database size={36} className="text-slate-500 mx-auto mb-3" />
                            <p className="text-white font-medium">Click to select a .db file</p>
                            <p className="text-slate-500 text-sm mt-1">SQLite database</p>
                        </label>

                        {sqliteTables.length > 0 && (
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">
                                    {sqliteTables.length} table(s) found — select one to load:
                                </label>
                                <div className="space-y-2">
                                    {sqliteTables.map(t => (
                                        <button key={t.table} onClick={() => setSelectedTable(t.table)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${selectedTable === t.table
                                                    ? "border-blue-500 bg-blue-950/30 text-white"
                                                    : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600"
                                                }`}>
                                            <span className="font-mono font-medium">{t.table}</span>
                                            <span className="text-slate-400 text-xs">{t.rows?.toLocaleString()} rows · {t.columns} cols</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleSQLiteLoad} disabled={!selectedTable || loading}
                                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-medium transition-colors">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                                    Load Table
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-800/50 rounded-xl p-3 text-sm">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Footer badges */}
            <div className="mt-8 flex gap-2 flex-wrap justify-center">
                {["CSV", "Excel", "JSON", "Paste", "URL/Scrape", "SQLite"].map(f => (
                    <span key={f} className="bg-slate-800/60 text-slate-400 text-xs px-3 py-1.5 rounded-full">{f}</span>
                ))}
            </div>
        </div>
    );
}