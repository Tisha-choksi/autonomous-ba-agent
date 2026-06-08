"use client";
import { useState } from "react";
import { Download, ZoomIn } from "lucide-react";
import { InteractiveChart, type ChartData } from "./InteractiveChart";

interface ChartRendererProps {
    chart: {
        image_base64?: string;
        chart_data?: ChartData;
        title?: string;
        chart_type?: string;
        x_col?: string;
        y_col?: string;
    };
}

export function ChartRenderer({ chart }: ChartRendererProps) {
    const [zoomed, setZoomed] = useState(false);

    // Prefer structured data → interactive Recharts chart
    if (chart.chart_data) {
        return (
            <InteractiveChart
                chartData={chart.chart_data}
                title={chart.title}
                initialType={chart.chart_type}
            />
        );
    }

    // Fallback: static base64 PNG (PDF reports, legacy responses)
    if (!chart.image_base64) return null;

    const download = () => {
        const a = document.createElement("a");
        a.href = `data:image/png;base64,${chart.image_base64}`;
        a.download = `${chart.title || "chart"}.png`;
        a.click();
    };

    return (
        <>
            <div style={{ background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#EEF2FF" }}>{chart.title || "Chart"}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                        {[{ icon: ZoomIn, label: "View", fn: () => setZoomed(true) }, { icon: Download, label: "PNG", fn: download }].map(({ icon: Icon, label, fn }) => (
                            <button key={label} onClick={fn} style={{ padding: "5px 10px", fontSize: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 8, cursor: "pointer", color: "#8BA3C7", display: "flex", alignItems: "center", gap: 4 }}>
                                <Icon size={12} />{label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ padding: 8, background: "#0a1628" }}>
                    <img src={`data:image/png;base64,${chart.image_base64}`} alt={chart.title || "Chart"} style={{ width: "100%", borderRadius: 8, display: "block", cursor: "zoom-in" }} onClick={() => setZoomed(true)} />
                </div>
            </div>

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
