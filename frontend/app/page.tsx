"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";

export default function HomePage() {
    const router = useRouter();
    const { uploadFile, sessions, loadSessions } = useSession();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any>(null);

    const onDrop = useCallback(async (accepted: File[]) => {
        if (!accepted.length) return;
        setUploading(true);
        setError(null);
        try {
            const session = await uploadFile(accepted[0]);
            setPreview(session);
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    }, [uploadFile, router]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: {
            "text/csv": [".csv"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/json": [".json"],
        },
        maxFiles: 1
    });

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            {/* Hero */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-blue-950/50 border border-blue-800/50 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    Autonomous Business Analyst Agent
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">
                    Drop Your Data.<br />
                    <span className="text-blue-400">Get Intelligence.</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                    Upload a CSV, Excel, or JSON file. The AI agent will analyze it,
                    find insights, build charts, and answer your questions — instantly.
                </p>
            </div>

            {/* Upload Zone */}
            <div className="w-full max-w-2xl">
                {!preview ? (
                    <div {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${isDragActive
                                ? "border-blue-500 bg-blue-950/30"
                                : "border-slate-700 hover:border-slate-500 bg-slate-900/50"
                            }`}>
                        <input {...getInputProps()} />
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={40} className="text-blue-400 animate-spin" />
                                <p className="text-slate-300 font-medium">Uploading and analyzing...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                                    <Upload size={28} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-lg">
                                        {isDragActive ? "Drop it here!" : "Drag & drop your file"}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">
                                        CSV, Excel (.xlsx/.xls), or JSON · Max 50MB
                                    </p>
                                </div>
                                <button className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                                    Browse File
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-green-800/50 rounded-2xl p-8 text-center">
                        <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Analysis Complete!</h3>
                        <p className="text-slate-400 mb-4">
                            <span className="text-white font-medium">{preview.file_name}</span> —{" "}
                            {preview.rows?.toLocaleString()} rows · {preview.columns} columns
                        </p>
                        <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg p-3 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {/* Supported formats */}
            <div className="mt-8 flex gap-4">
                {[".CSV", ".XLSX", ".XLS", ".JSON"].map(f => (
                    <div key={f} className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg text-xs text-slate-400">
                        <FileSpreadsheet size={12} />
                        {f}
                    </div>
                ))}
            </div>
        </div>
    );
}