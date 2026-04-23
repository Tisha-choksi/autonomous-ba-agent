"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function ExplorerPage() {
    const { session } = useSession();
    const [data, setData] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sortCol, setSortCol] = useState<string | undefined>();
    const [sortDesc, setSortDesc] = useState(false);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const result = await api.getData(session.id, page, 50, search || undefined, sortCol, sortDesc);
            setData(result);
        } finally {
            setLoading(false);
        }
    }, [session, page, search, sortCol, sortDesc]);

    useEffect(() => { load(); }, [load]);

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDesc(!sortDesc);
        else { setSortCol(col); setSortDesc(false); }
        setPage(1);
    };

    if (!session) return (
        <div className="flex items-center justify-center h-screen text-slate-400">Upload a dataset first</div>
    );

    return (
        <div className="p-8 flex flex-col h-screen">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <h1 className="text-2xl font-bold text-white">Data Explorer</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search all columns..."
                            className="pl-8 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                    {loading && <Loader2 size={16} className="text-blue-400 animate-spin" />}
                </div>
            </div>

            {data && (
                <>
                    <div className="text-xs text-slate-400 mb-3">
                        {data.total.toLocaleString()} rows · Page {data.page} of {data.pages}
                    </div>
                    <div className="flex-1 overflow-auto rounded-xl border border-slate-800">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
                                <tr>
                                    {data.columns?.map((col: string) => (
                                        <th key={col} onClick={() => handleSort(col)}
                                            className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white whitespace-nowrap">
                                            {col}
                                            {sortCol === col && <span className="ml-1">{sortDesc ? "↓" : "↑"}</span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.data?.map((row: any, i: number) => (
                                    <tr key={i} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${i % 2 === 0 ? "" : "bg-slate-900/50"}`}>
                                        {data.columns?.map((col: string) => (
                                            <td key={col} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-xs truncate">
                                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                                                    <span className="text-slate-600 italic">null</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 flex-shrink-0">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 disabled:opacity-40">
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span className="text-sm text-slate-400">Page {page} / {data.pages}</span>
                        <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                            className="flex items-center gap-1 px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 disabled:opacity-40">
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}