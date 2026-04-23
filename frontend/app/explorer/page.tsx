"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Loader2, Table2, ArrowUpDown, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExplorerPage() {
    const { session } = useSession();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [sortCol, setSortCol] = useState<string | undefined>();
    const [sortDesc, setSortDesc] = useState(false);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try { setData(await api.getData(session.id, page, 50, search || undefined, sortCol, sortDesc)); }
        finally { setLoading(false); }
    }, [session, page, search, sortCol, sortDesc]);

    useEffect(() => { load(); }, [load]);

    const handleSort = (col: string) => { if (sortCol === col) setSortDesc(!sortDesc); else { setSortCol(col); setSortDesc(false); } setPage(1); };
    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{ padding: "56px 64px", textAlign: "center", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 20 }}>
                <Table2 size={40} color="#3D5278" style={{ margin: "0 auto 16px", display: "block" }} />
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#EEF2FF", marginBottom: 8 }}>No Dataset</div>
                <button onClick={() => router.push("/")} style={{ padding: "10px 22px", fontSize: 13, fontWeight: 600, background: "linear-gradient(135deg,#00D4FF,#0099CC)", color: "#020812", border: "none", borderRadius: 10, cursor: "pointer", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <Upload size={13} /> Upload Data
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: "24px 28px 20px" }}>

            {/* Header */}
            <div className="anim-fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700, color: "#EEF2FF", letterSpacing: "-0.02em", marginBottom: 2 }}>Data Explorer</h1>
                    {data && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: "#3D5278" }}>{data.total.toLocaleString()} rows · {data.columns?.length} columns{search && ` · filtered by "${search}"`}</div>}
                </div>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#3D5278", pointerEvents: "none" }} />
                        <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search all columns..." style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, width: 240, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 10, color: "#EEF2FF", outline: "none" }} />
                    </div>
                    <button type="submit" style={{ padding: "8px 14px", fontSize: 12.5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 10, cursor: "pointer", color: "#8BA3C7" }}>Search</button>
                    {search && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} style={{ padding: "8px 12px", fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.08)", borderRadius: 10, cursor: "pointer", color: "#3D5278" }}>Clear</button>}
                    {loading && <Loader2 size={15} color="#00D4FF" style={{ animation: "spin 1s linear infinite" }} />}
                </form>
            </div>

            {/* Table */}
            <div className="anim-fade-up delay-1" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 16 }}>
                <div style={{ flex: 1, overflow: "auto" }}>
                    {data ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 48, textAlign: "center" }}>#</th>
                                    {data.columns?.map((col: string) => (
                                        <th key={col} onClick={() => handleSort(col)} style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 1.5, background: "#00D4FF", flexShrink: 0 }} />
                                                {col}
                                                {sortCol === col ? <span style={{ color: "#00D4FF", fontSize: 10 }}>{sortDesc ? "↓" : "↑"}</span> : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.data?.map((row: any, i: number) => (
                                    <tr key={i}>
                                        <td style={{ textAlign: "center", color: "#3D5278", fontSize: 11 }}>{(page - 1) * 50 + i + 1}</td>
                                        {data.columns?.map((col: string) => (
                                            <td key={col} style={{ maxWidth: 200 }}>
                                                {row[col] !== null && row[col] !== undefined ? (
                                                    <span style={{ color: typeof row[col] === "number" ? "#00D4FF" : "#8BA3C7" }}>
                                                        {String(row[col]).length > 30 ? String(row[col]).slice(0, 30) + "…" : String(row[col])}
                                                    </span>
                                                ) : <span style={{ color: "#3D5278", fontStyle: "italic", fontSize: 11 }}>null</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: 12 }}>
                            {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {data && data.pages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "7px 14px", fontSize: 12.5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 10, cursor: "pointer", color: "#8BA3C7", display: "flex", alignItems: "center", gap: 5, opacity: page === 1 ? 0.4 : 1 }}>
                            <ChevronLeft size={14} />Prev
                        </button>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                                let p = i + 1;
                                if (data.pages > 7) { if (page <= 4) p = i + 1; else if (page >= data.pages - 3) p = data.pages - 6 + i; else p = page - 3 + i; }
                                return (
                                    <button key={p} onClick={() => setPage(p)} style={{ width: 28, height: 28, borderRadius: 7, fontSize: 12, background: page === p ? "#00D4FF" : "transparent", border: `1px solid ${page === p ? "#00D4FF" : "rgba(0,212,255,0.10)"}`, color: page === p ? "#020812" : "#3D5278", cursor: "pointer", fontWeight: page === p ? 600 : 400, transition: "all 0.2s" }}>{p}</button>
                                );
                            })}
                        </div>
                        <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} style={{ padding: "7px 14px", fontSize: 12.5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 10, cursor: "pointer", color: "#8BA3C7", display: "flex", alignItems: "center", gap: 5, opacity: page === data.pages ? 0.4 : 1 }}>
                            Next<ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}