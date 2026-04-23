"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { FileDown, FileText, Table, Loader2, CheckCircle } from "lucide-react";

export default function ReportsPage() {
    const { session } = useSession();
    const [reports, setReports] = useState<any[]>([]);
    const [generating, setGenerating] = useState<string | null>(null);

    useEffect(() => {
        if (session) api.listReports(session.id).then(setReports);
    }, [session]);

    const generate = async (type: "pdf" | "excel") => {
        if (!session) return;
        setGenerating(type);
        try {
            const result = type === "pdf" ? await api.generatePDF(session.id) : await api.generateExcel(session.id);
            setReports(prev => [...prev, { ...result, created_at: new Date().toISOString() }]);
            window.open(api.getDownloadURL(result.file_name), "_blank");
        } finally {
            setGenerating(null);
        }
    };

    if (!session) return (
        <div className="flex items-center justify-center h-screen text-slate-400">Upload a dataset first</div>
    );

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
            <p className="text-slate-400 text-sm mb-8">Generate comprehensive analysis reports</p>

            {/* Generate buttons */}
            <div className="grid grid-cols-2 gap-4 mb-10 max-w-xl">
                <button onClick={() => generate("pdf")} disabled={!!generating}
                    className="flex flex-col items-center gap-3 p-6 bg-slate-900 border border-slate-800 hover:border-red-600/50 rounded-xl transition-all group">
                    {generating === "pdf"
                        ? <Loader2 size={32} className="text-red-400 animate-spin" />
                        : <FileText size={32} className="text-red-400" />
                    }
                    <div className="text-center">
                        <div className="font-medium text-white">PDF Report</div>
                        <div className="text-xs text-slate-400 mt-1">EDA · KPIs · Insights · Data Sample</div>
                    </div>
                </button>

                <button onClick={() => generate("excel")} disabled={!!generating}
                    className="flex flex-col items-center gap-3 p-6 bg-slate-900 border border-slate-800 hover:border-green-600/50 rounded-xl transition-all group">
                    {generating === "excel"
                        ? <Loader2 size={32} className="text-green-400 animate-spin" />
                        : <Table size={32} className="text-green-400" />
                    }
                    <div className="text-center">
                        <div className="font-medium text-white">Excel Report</div>
                        <div className="text-xs text-slate-400 mt-1">4 sheets: Data · EDA · KPIs · Insights</div>
                    </div>
                </button>
            </div>

            {/* Past reports */}
            {reports.length > 0 && (
                <>
                    <h2 className="text-lg font-semibold text-white mb-4">Generated Reports</h2>
                    <div className="space-y-3">
                        {reports.map((r, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={16} className="text-green-400" />
                                    <div>
                                        <div className="text-sm font-medium text-white">{r.file_name}</div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(r.created_at).toLocaleString()} · {r.report_type?.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <a href={api.getDownloadURL(r.file_name)} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors">
                                    <FileDown size={12} />
                                    Download
                                </a>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}