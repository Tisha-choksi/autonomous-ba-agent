"use client";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
    label: string;
    value: number | string;
    format?: "number" | "currency" | "percent";
    change?: number;
    icon?: React.ReactNode;
    accentColor?: string;
    delay?: number;
}

function useCountUp(target: number, duration = 1200) {
    const [current, setCurrent] = useState(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        if (typeof target !== "number") return;
        const start = performance.now();
        const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCurrent(target * eased);
            if (progress < 1) frameRef.current = requestAnimationFrame(step);
        };
        frameRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration]);

    return current;
}

export function KPICard({
    label, value, format = "number", change, icon, accentColor = "var(--cyan)", delay = 0,
}: KPICardProps) {
    const isNumber = typeof value === "number";
    const animated = useCountUp(isNumber ? value : 0, 1400);

    const formatVal = (v: number): string => {
        if (format === "currency") return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (format === "percent") return `${v.toFixed(1)}%`;
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
        return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
    };

    const displayValue = isNumber ? formatVal(animated) : String(value);

    return (
        <div className="glass-card anim-fade-up" style={{
            padding: "18px 20px",
            animationDelay: `${delay}ms`,
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Accent line top */}
            <div style={{
                position: "absolute",
                top: 0, left: "10%", right: "10%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                opacity: 0.6,
            }} />

            {/* Glow bg */}
            <div style={{
                position: "absolute",
                top: -30, right: -30,
                width: 80, height: 80,
                background: accentColor,
                borderRadius: "50%",
                opacity: 0.04,
                filter: "blur(20px)",
                pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{
                    fontSize: 11, color: "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    fontWeight: 500,
                    lineHeight: 1.3,
                    maxWidth: "75%",
                }}>
                    {label}
                </div>
                {icon && (
                    <div style={{
                        width: 28, height: 28,
                        background: `${accentColor}18`,
                        borderRadius: 7,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        {icon}
                    </div>
                )}
            </div>

            <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 26, fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: 8,
            }}>
                {displayValue}
            </div>

            {change !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {change > 0
                        ? <TrendingUp size={12} color="var(--green)" />
                        : change < 0
                            ? <TrendingDown size={12} color="var(--red)" />
                            : <Minus size={12} color="var(--text-muted)" />}
                    <span style={{
                        fontSize: 11.5, fontWeight: 500,
                        color: change > 0 ? "var(--green)" : change < 0 ? "var(--red)" : "var(--text-muted)",
                    }}>
                        {change > 0 ? "+" : ""}{change.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>vs prev period</span>
                </div>
            )}
        </div>
    );
}