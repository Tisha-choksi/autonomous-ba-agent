"use client";
import { useState } from "react";
import { Download, ZoomIn, BarChart3 } from "lucide-react";

interface ChartRendererProps {
    chart: { image_base64: string; title?: string; chart_type?: string; x_col?: string; y_col?: string };
    className?: string;
}

const TYPE_ICONS: Record<string, string> = {
    bar: "▐", line: "╌", scatter: "·", pie: "◕",
    histogram: "▂", heatmap: "▦", box: "⊡",
};

export function ChartRenderer({ chart }: ChartRendererProps) {
    const [zoomed, setZoomed] = useState(false);

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = `data:image/png;base64,${chart.image_base64}`;
        a.download = `${chart.title || "chart"}.png`;
        a.click();
    };

    return (
        <>
            <div className="glass-card" style={{
                padding: 0, overflow: "hidden", position: "relative",
                transition: "all 0.3s ease",
            }}>
                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.2)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            fontFamily: "var(--font-mono)", fontSize: 14,
                            color: "var(--cyan)", opacity: 0.7,
                        }}>
                            {TYPE_ICONS[chart.chart_type || ""] || "◈"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                            {chart.title || "Chart"}
                        </span>
                        {chart.chart_type && (
                            <span className="badge badge-cyan" style={{ fontSize: 9.5 }}>
                                {chart.chart_type.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setZoomed(true)}
                            className="btn-ghost"
                            style={{ padding: "5px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                            <ZoomIn size={12} /> View
                        </button>
                        <button onClick={handleDownload}
                            className="btn-ghost"
                            style={{ padding: "5px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                            <Download size={12} /> PNG
                        </button>
                    </div>
                </div>

                {/* Chart image */}
                <div style={{ padding: 8, background: "#0a1628" }}>
                    <img
                        src={`data:image/png;base64,${chart.image_base64}`}
                        alt={chart.title || "Chart"}
                        style={{
                            width: "100%", borderRadius: 8,
                            display: "block",
                            cursor: "zoom-in",
                        }}
                        onClick={() => setZoomed(true)}
                    />
                </div>

                {/* Col info */}
                {(chart.x_col || chart.y_col) && (
                    <div style={{
                        padding: "8px 14px",
                        borderTop: "1px solid var(--border)",
                        display: "flex", gap: 12,
                    }}>
                        {chart.x_col && (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)" }}>
                                X: <span style={{ color: "var(--cyan)" }}>{chart.x_col}</span>
                            </span>
                        )}
                        {chart.y_col && (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)" }}>
                                Y: <span style={{ color: "var(--purple)" }}>{chart.y_col}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Zoom modal */}
            {zoomed && (
                <div
                    onClick={() => setZoomed(false)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        background: "rgba(2, 8, 18, 0.92)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 24,
                        backdropFilter: "blur(8px)",
                        cursor: "zoom-out",
                        animation: "fadeIn 0.2s ease",
                    }}>
                    <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
                        <img
                            src={`data:image/png;base64,${chart.image_base64}`}
                            alt={chart.title}
                            style={{
                                maxWidth: "100%", maxHeight: "85vh",
                                borderRadius: 12,
                                border: "1px solid var(--border)",
                                boxShadow: "0 0 60px rgba(0,0,0,0.8)",
                            }}
                        />
                        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                            Click anywhere to close · <button
                                onClick={handleDownload}
                                style={{ color: "var(--cyan)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>
                                Download PNG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}