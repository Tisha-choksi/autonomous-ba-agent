"use client";
import { useState } from "react";
import { Download, ZoomIn } from "lucide-react";

interface ChartRendererProps {
    chart: { image_base64: string; title?: string; chart_type?: string; x_col?: string; y_col?: string };
}

const ICONS: Record<string, string> = { bar: "▐", line: "╌", scatter: "·", pie: "◕", histogram: "▂", heatmap: "▦", box: "⊡" };

export function ChartRenderer({ chart }: ChartRendererProps) {
    const [zoomed, setZoomed] = useState(false);

    const download = () => {
        const a = document.createElement("a");
        a.href = `data:image/png;base64,${chart.image_base64}`;
        a.download = `${chart.title || "chart"}.png`;
        a.click();
    };

    return (
        <>
            <div style={{ background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 16, overflow: "hidden", transition: "all 0.3s" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#00D4FF", opacity: 0.7 }}>{ICONS[chart.chart_type || ""] || "◈"}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#EEF2FF" }}>{chart.title || "Chart"}</span>
                        {chart.chart_type && <span style={{ padding: "2px 8px", fontSize: 9.5, background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.22)", color: "#00D4FF", borderRadius: 100, fontWeight: 500 }}>{chart.chart_type.toUpperCase()}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        {[{ icon: ZoomIn, label: "View", fn: () => setZoomed(true) }, { icon: Download, label: "PNG", fn: download }].map(({ icon: Icon, label, fn }) => (
                            <button key={label} onClick={fn} style={{ padding: "5px 10px", fontSize: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 8, cursor: "pointer", color: "#8BA3C7", display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
                                <Icon size={12} />{label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Image */}
                <div style={{ padding: 8, background: "#0a1628" }}>
                    <img src={`data:image/png;base64,${chart.image_base64}`} alt={chart.title || "Chart"} style={{ width: "100%", borderRadius: 8, display: "block", cursor: "zoom-in" }} onClick={() => setZoomed(true)} />
                </div>
                {/* Cols */}
                {(chart.x_col || chart.y_col) && (
                    <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(0,212,255,0.06)", display: "flex", gap: 12 }}>
                        {chart.x_col && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#3D5278" }}>X: <span style={{ color: "#00D4FF" }}>{chart.x_col}</span></span>}
                        {chart.y_col && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#3D5278" }}>Y: <span style={{ color: "#7C5CFC" }}>{chart.y_col}</span></span>}
                    </div>
                )}
            </div>

            {/* Zoom modal */}
            {zoomed && (
                <div onClick={() => setZoomed(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,8,18,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)", cursor: "zoom-out" }}>
                    <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
                        <img src={`data:image/png;base64,${chart.image_base64}`} alt={chart.title} style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12, border: "1px solid rgba(0,212,255,0.15)", boxShadow: "0 0 60px rgba(0,0,0,0.8)" }} />
                        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#3D5278" }}>
                            Click anywhere to close ·{" "}
                            <button onClick={download} style={{ color: "#00D4FF", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>Download PNG</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}