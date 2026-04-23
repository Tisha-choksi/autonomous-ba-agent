"use client";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
    label: string;
    value: number | string;
    format?: "number" | "currency" | "percent";
    change?: number;
    accentColor?: string;
    delay?: number;
}

function useCountUp(target: number, duration = 1400) {
    const [cur, setCur] = useState(0);
    const ref = useRef<number>(0);
    useEffect(() => {
        if (typeof target !== "number") return;
        const start = performance.now();
        const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setCur(target * e);
            if (p < 1) ref.current = requestAnimationFrame(step);
        };
        ref.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(ref.current);
    }, [target, duration]);
    return cur;
}

export function KPICard({ label, value, format = "number", change, accentColor = "#00D4FF", delay = 0 }: KPICardProps) {
    const isNum = typeof value === "number";
    const animated = useCountUp(isNum ? value : 0, 1400);

    const fmt = (v: number) => {
        if (format === "currency") return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (format === "percent") return `${v.toFixed(1)}%`;
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
        return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
    };

    return (
        <div className="anim-fade-up" style={{
            padding: "18px 20px",
            background: "rgba(8,18,38,0.85)",
            border: "1px solid rgba(0,212,255,0.09)",
            borderRadius: 16,
            position: "relative", overflow: "hidden",
            animationDelay: `${delay}ms`,
            transition: "border-color 0.3s,transform 0.3s",
        }}>
            {/* Top accent line */}
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg,transparent,${accentColor},transparent)`, opacity: 0.6 }} />
            {/* Glow */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, background: accentColor, borderRadius: "50%", opacity: 0.04, filter: "blur(20px)", pointerEvents: "none" }} />

            <div style={{ fontSize: 11, color: "#3D5278", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500, marginBottom: 10, lineHeight: 1.3 }}>
                {label}
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, color: "#EEF2FF", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: change !== undefined ? 8 : 0 }}>
                {isNum ? fmt(animated) : String(value)}
            </div>
            {change !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {change > 0 ? <TrendingUp size={12} color="#00FF94" /> : change < 0 ? <TrendingDown size={12} color="#FF4D6A" /> : <Minus size={12} color="#3D5278" />}
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: change > 0 ? "#00FF94" : change < 0 ? "#FF4D6A" : "#3D5278" }}>
                        {change > 0 ? "+" : ""}{change.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 11, color: "#3D5278" }}>vs prev</span>
                </div>
            )}
        </div>
    );
}