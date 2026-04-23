"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Loader2, Table2, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExplorerPage() {
    const { session } = useSession();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sortCol, setSortCol] = useState<string | undefined>();
    const [sortDesc, setSortDesc] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    const load = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const result = await api.getData(session.id, page, 50, search || undefined, sortCol, sortDesc);
            setData(result);
        } finally { setLoading(false); }
    }, [session, page, search, sortCol, sortDesc]);

    useEffect(() => { load(); }, [load]);

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDesc(!sortDesc);
        else { setSortCol(col); setSortDesc(false); }
        setPage(1);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const getColType = (col: string) => {
        if (!data) return "unknown";
        const sample = data.data?.[0]?.[col];
        if (sample === null || sample === undefined) return "null";
        if (typeof sample === "number") return "number";
        return "string";
    };

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="glass-card anim-scale-in" style={{ padding: "56px 64px", textAlign: "center" }}>
                <Table2 size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>No Dataset</h2>
                <button className="btn-primary" onClick={() => router.push("/")} style={{ padding: "9px 22px", fontSize: 13, marginTop: 8 }}>
                    Upload Data
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: "24px 28px 20px" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div className="anim-fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 2 }}>
                        Data Explorer
                    </h1>
                    {data && (
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)" }}>
                            {data.total.toLocaleString()} rows · {data.columns?.length} columns
                            {search && ` · filtered by "${search}"`}
                        </div>
                    )}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={13} style={{
                            position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                            color: "var(--text-muted)", pointerEvents: "none",
                        }} />
                        <input
                            className="input-field"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search all columns..."
                            style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, width: 240 }}
                        />
                    </div>
                    <button type="submit" className="btn-ghost" style={{ padding: "8px 14px", fontSize: 12.5 }}>
                        Search
                    </button>
                    {search && (
                        <button type="button" className="btn-ghost"
                            onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                            style={{ padding: "8px 12px", fontSize: 12 }}>
                            Clear
                        </button>
                    )}
                    {loading && <Loader2 size={15} color="var(--cyan)" style={{ animation: "spin 1s linear infinite" }} />}
                </form>
            </div>

            {/* Table */}
            <div className="glass-card anim-fade-up delay-1"
                style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
                <div style={{ flex: 1, overflow: "auto" }}>
                    {data ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 48, textAlign: "center" }}>#</th>
                                    {data.columns?.map((col: string) => (
                                        <th key={col} onClick={() => handleSort(col)}
                                            style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                <span style={{
                                                    display: "inline-block", width: 6, height: 6, borderRadius: 1.5,
                                                    background: getColType(col) === "number" ? "var(--cyan)" : "var(--purple)",
                                                    flexShrink: 0,
                                                }} />
                                                {col}
                                                {sortCol === col
                                                    ? <span style={{ color: "var(--cyan)", fontSize: 10 }}>{sortDesc ? "↓" : "↑"}</span>
                                                    : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.data?.map((row: any, i: number) => (
                                    <tr key={i}>
                                        <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>
                                            {(page - 1) * 50 + i + 1}
                                        </td>
                                        {data.columns?.map((col: string) => (
                                            <td key={col} style={{ maxWidth: 200 }}>
                                                {row[col] !== null && row[col] !== undefined ? (
                                                    <span style={{
                                                        color: typeof row[col] === "number" ? "var(--cyan)" : "var(--text-secondary)",
                                                    }}>
                                                        {String(row[col]).length > 30 ? String(row[col]).slice(0, 30) + "…" : String(row[col])}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 11 }}>null</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 40, margin: "0 12px", borderRadius: 4 }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {data && data.pages > 1 && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px",
                        borderTop: "1px solid var(--border)",
                        background: "rgba(0,0,0,0.2)",
                        flexShrink: 0,
                    }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-ghost"
                            style={{ padding: "7px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, opacity: page === 1 ? 0.4 : 1 }}>
                            <ChevronLeft size={14} /> Prev
                        </button>

                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                                let p: number;
                                if (data.pages <= 7) p = i + 1;
                                else if (page <= 4) p = i + 1;
                                else if (page >= data.pages - 3) p = data.pages - 6 + i;
                                else p = page - 3 + i;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        style={{
                                            width: 28, height: 28, borderRadius: 7, fontSize: 12,
                                            background: page === p ? "var(--cyan)" : "transparent",
                                            border: `1px solid ${page === p ? "var(--cyan)" : "var(--border)"}`,
                                            color: page === p ? "#020812" : "var(--text-muted)",
                                            cursor: "pointer", fontWeight: page === p ? 600 : 400,
                                            transition: "all 0.2s ease",
                                        }}>
                                        {p}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                            disabled={page === data.pages}
                            className="btn-ghost"
                            style={{ padding: "7px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, opacity: page === data.pages ? 0.4 : 1 }}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1.5, background: "var(--cyan)", display: "inline-block" }} />
                    Numeric
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1.5, background: "var(--purple)", display: "inline-block" }} />
                    Text
                </span>
            </div>
        </div>
    );
}