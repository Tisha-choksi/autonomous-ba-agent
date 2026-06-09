"use client";
import { useState, useRef } from "react";
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area,
    PieChart, Pie, Cell, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

export type ChartData =
    | { type: "bar" | "line" | "histogram"; data: { name: string; value: number }[]; xKey: string; yKey: string; xLabel?: string; yLabel?: string }
    | { type: "scatter"; data: { x: number; y: number }[]; xLabel?: string; yLabel?: string }
    | { type: "pie"; data: { name: string; value: number }[]; xKey: string; yKey: string }
    | { type: "heatmap"; columns: string[]; matrix: number[][] };

interface Props {
    chartData: ChartData;
    title?: string;
    initialType?: string;
}

const PALETTES: Record<string, string[]> = {
    cyan:   ["#00D4FF", "#0099CC", "#007AA3", "#00577A", "#003D5C"],
    purple: ["#7C5CFC", "#5B3FD4", "#3D26A8", "#231580", "#120A5C"],
    green:  ["#00FF94", "#00CC77", "#009960", "#006644", "#003D2A"],
    sunset: ["#FFB547", "#FF8C42", "#FF6B35", "#FF4D6A", "#CC3355"],
    mixed:  ["#00D4FF", "#7C5CFC", "#00FF94", "#FFB547", "#FF4D6A"],
};

const SWITCHABLE: Record<string, string[]> = {
    bar: ["bar", "line", "area"], line: ["bar", "line", "area"],
    histogram: ["bar", "line", "area"], area: ["bar", "line", "area"],
    pie: ["pie"], scatter: ["scatter"], heatmap: ["heatmap"],
};

const TT_STYLE = {
    contentStyle: { background: "#0a1628", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, fontSize: 12, color: "#EEF2FF" },
    labelStyle: { color: "#8BA3C7" },
    cursor: { fill: "rgba(0,212,255,0.05)" },
};

export function InteractiveChart({ chartData, title, initialType }: Props) {
    const [activeType, setActiveType] = useState(initialType || chartData.type);
    const [palette, setPalette] = useState<keyof typeof PALETTES>("cyan");
    const containerRef = useRef<HTMLDivElement>(null);
    const colors = PALETTES[palette];
    const compat = SWITCHABLE[chartData.type] || [chartData.type];

    const downloadSVG = () => {
        const svg = containerRef.current?.querySelector("svg");
        if (!svg) return;
        const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${title || "chart"}.svg` });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const renderBody = () => {
        if (chartData.type === "heatmap") return renderHeatmap(chartData.columns, chartData.matrix);
        if (chartData.type === "scatter") return renderScatter(chartData.data, chartData.xLabel, chartData.yLabel);
        if (chartData.type === "pie" || activeType === "pie") return renderPie((chartData as any).data);

        const data = (chartData as any).data as { name: string; value: number }[];
        const xLabel = (chartData as any).xLabel;
        const yLabel = (chartData as any).yLabel;
        const xInterval = data.length > 20 ? Math.floor(data.length / 10) : 0;

        const axes = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#3D5278" tick={{ fill: "#3D5278", fontSize: 10 }}
                    angle={-30} textAnchor="end" interval={xInterval}
                    label={{ value: xLabel, position: "insideBottom", offset: -22, fill: "#3D5278", fontSize: 11 }} />
                <YAxis stroke="#3D5278" tick={{ fill: "#3D5278", fontSize: 11 }}
                    label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#3D5278", fontSize: 11 }} />
                <Tooltip {...TT_STYLE} />
            </>
        );
        const margin = { top: 10, right: 20, bottom: 48, left: 24 };

        if (activeType === "area")
            return <ResponsiveContainer width="100%" height={280}><AreaChart data={data} margin={margin}>{axes}<Area type="monotone" dataKey="value" stroke={colors[0]} fill={`${colors[0]}22`} strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer>;

        if (activeType === "line")
            return <ResponsiveContainer width="100%" height={280}><LineChart data={data} margin={margin}>{axes}<Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={data.length < 60 ? { fill: colors[0], r: 2 } : false} /></LineChart></ResponsiveContainer>;

        return (
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={margin}>
                    {axes}
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderPie = (data: { name: string; value: number }[]) => (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip {...TT_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8BA3C7" }} />
            </PieChart>
        </ResponsiveContainer>
    );

    const renderScatter = (data: { x: number; y: number }[], xLabel?: string, yLabel?: string) => (
        <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" stroke="#3D5278" tick={{ fill: "#3D5278", fontSize: 11 }} name={xLabel}
                    label={{ value: xLabel, position: "insideBottom", offset: -22, fill: "#3D5278", fontSize: 11 }} />
                <YAxis type="number" dataKey="y" stroke="#3D5278" tick={{ fill: "#3D5278", fontSize: 11 }} name={yLabel}
                    label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#3D5278", fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={TT_STYLE.contentStyle} />
                <Scatter data={data} fill={colors[0]} opacity={0.7} />
            </ScatterChart>
        </ResponsiveContainer>
    );

    const renderHeatmap = (columns: string[], matrix: number[][]) => {
        const getColor = (v: number) => {
            const c = Math.max(-1, Math.min(1, v));
            return c < 0 ? `rgba(255,77,106,${Math.abs(c) * 0.85})` : `rgba(0,212,255,${c * 0.85})`;
        };
        return (
            <div style={{ overflowX: "auto", padding: "8px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${columns.length}, minmax(44px, 1fr))`, gap: 2, minWidth: columns.length * 50 + 84 }}>
                    <div />
                    {columns.map(c => <div key={c} style={{ fontSize: 9, color: "#3D5278", textAlign: "center", padding: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c}</div>)}
                    {matrix.map((row, i) => (
                        <>
                            <div key={`r${i}`} style={{ fontSize: 9, color: "#3D5278", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{columns[i]}</div>
                            {row.map((val, j) => (
                                <div key={j} title={`${columns[i]} × ${columns[j]}: ${val}`}
                                    style={{ background: getColor(val), borderRadius: 3, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#EEF2FF" }}>
                                    {val.toFixed(2)}
                                </div>
                            ))}
                        </>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 10, color: "#3D5278", justifyContent: "center" }}>
                    <span style={{ width: 28, height: 10, borderRadius: 2, background: "rgba(255,77,106,0.8)", display: "inline-block" }} />−1
                    <span style={{ width: 28, height: 10, borderRadius: 2, background: "rgba(255,255,255,0.07)", display: "inline-block", marginLeft: 8 }} />0
                    <span style={{ width: 28, height: 10, borderRadius: 2, background: "rgba(0,212,255,0.8)", display: "inline-block", marginLeft: 8 }} />+1
                </div>
            </div>
        );
    };

    return (
        <div style={{ background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 16, overflow: "hidden" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,0,0,0.2)", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#EEF2FF" }}>{title || "Chart"}</span>
                    {compat.length > 1 && (
                        <div style={{ display: "flex", gap: 2, background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 8 }}>
                            {compat.map(t => (
                                <button key={t} onClick={() => setActiveType(t)} style={{ padding: "3px 9px", fontSize: 10, fontWeight: 500, background: activeType === t ? "rgba(0,212,255,0.15)" : "transparent", border: `1px solid ${activeType === t ? "rgba(0,212,255,0.4)" : "transparent"}`, color: activeType === t ? "#00D4FF" : "#3D5278", borderRadius: 6, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        {Object.entries(PALETTES).map(([name, cols]) => (
                            <button key={name} onClick={() => setPalette(name)} title={name}
                                style={{ width: 14, height: 14, borderRadius: "50%", background: cols[0], border: `2px solid ${palette === name ? "#EEF2FF" : "transparent"}`, cursor: "pointer", padding: 0, flexShrink: 0 }} />
                        ))}
                    </div>
                    <button onClick={downloadSVG} style={{ padding: "4px 10px", fontSize: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 8, cursor: "pointer", color: "#8BA3C7", display: "flex", alignItems: "center", gap: 4 }}>
                        <Download size={12} /> SVG
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div ref={containerRef} style={{ padding: "16px 8px 8px", background: "#060f20" }}>
                {renderBody()}
            </div>

            {/* Footer axes labels */}
            {("xLabel" in chartData || "yLabel" in chartData) && (
                <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(0,212,255,0.06)", display: "flex", gap: 12 }}>
                    {"xLabel" in chartData && chartData.xLabel && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#3D5278" }}>X: <span style={{ color: "#00D4FF" }}>{chartData.xLabel}</span></span>}
                    {"yLabel" in chartData && chartData.yLabel && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#3D5278" }}>Y: <span style={{ color: "#7C5CFC" }}>{chartData.yLabel}</span></span>}
                </div>
            )}
        </div>
    );
}
