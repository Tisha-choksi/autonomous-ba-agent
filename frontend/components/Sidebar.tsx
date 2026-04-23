"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, MessageSquare, Lightbulb, Table2, FileDown, Upload, Brain, Cpu, ChevronRight, Database, Activity } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";

const NAV = [
    { href: "/", icon: Upload, label: "Data Source", desc: "Load dataset" },
    { href: "/dashboard", icon: BarChart3, label: "Dashboard", desc: "KPIs & charts" },
    { href: "/chat", icon: MessageSquare, label: "AI Chat", desc: "Ask questions" },
    { href: "/insights", icon: Lightbulb, label: "Insights", desc: "Auto-analysis" },
    { href: "/explorer", icon: Table2, label: "Explorer", desc: "Browse data" },
    { href: "/reports", icon: FileDown, label: "Reports", desc: "PDF & Excel" },
];
const STATUS = [
    { label: "LangGraph Agent", status: "Ready", color: "#00FF94" },
    { label: "Groq LLaMA-3.3", status: "Online", color: "#00D4FF" },
    { label: "11 Tools", status: "Loaded", color: "#7C5CFC" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { session } = useSession();

    return (
        <aside style={{ position: "fixed", left: 0, top: 0, width: 260, height: "100vh", background: "linear-gradient(180deg,#06101f 0%,#040c1a 100%)", borderRight: "1px solid rgba(0,212,255,0.10)", display: "flex", flexDirection: "column", zIndex: 50 }}>

            {/* Logo */}
            <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(0,212,255,0.10)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#00D4FF,#7C5CFC)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(0,212,255,0.35)", flexShrink: 0 }}>
                        <Brain size={19} color="#020812" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15.5, color: "#EEF2FF", letterSpacing: "-0.01em" }}>BA Agent</div>
                        <div style={{ fontSize: 10, color: "#3D5278", letterSpacing: "0.06em", marginTop: 1 }}>BUSINESS ANALYST AI</div>
                    </div>
                </div>
            </div>

            {/* Session */}
            <div style={{ padding: "12px 12px 0" }}>
                {session ? (
                    <div style={{ padding: "10px 12px", background: "linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,92,252,0.06))", border: "1px solid rgba(0,212,255,0.22)", borderRadius: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                            <span className="status-dot" />
                            <span style={{ fontSize: 10, color: "#00D4FF", fontWeight: 500, letterSpacing: "0.05em" }}>ACTIVE DATASET</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "#EEF2FF", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{session.file_name}</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#3D5278", display: "flex", gap: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Database size={9} color="#3D5278" />{session.rows?.toLocaleString()} rows</span>
                            <span style={{ color: "rgba(0,212,255,0.15)" }}>·</span>
                            <span>{session.columns} cols</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(0,212,255,0.10)", borderRadius: 10, textAlign: "center" }}>
                        <span style={{ fontSize: 11.5, color: "#3D5278" }}>No dataset loaded</span>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
                <div style={{ fontSize: 10, color: "#3D5278", letterSpacing: "0.09em", padding: "0 6px 8px", fontWeight: 500 }}>NAVIGATION</div>
                {NAV.map(({ href, icon: Icon, label, desc }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href} style={{ textDecoration: "none", display: "block", marginBottom: 2 }}>
                            <div className={`sidebar-link${active ? " active" : ""}`}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Icon size={14} color={active ? "#00D4FF" : "#3D5278"} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13.5, lineHeight: 1.2 }}>{label}</div>
                                    <div style={{ fontSize: 10.5, color: "#3D5278", marginTop: 1 }}>{desc}</div>
                                </div>
                                {active && <ChevronRight size={12} color="#00D4FF" style={{ flexShrink: 0, opacity: 0.6 }} />}
                            </div>
                        </Link>
                    );
                })}

                <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.1),transparent)", margin: "12px 6px" }} />

                <div style={{ padding: "0 6px" }}>
                    <div style={{ fontSize: 10, color: "#3D5278", letterSpacing: "0.09em", marginBottom: 8, fontWeight: 500 }}>AI STATUS</div>
                    {STATUS.map(({ label, status, color }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <Activity size={10} color={color} />
                                <span style={{ fontSize: 11.5, color: "#3D5278" }}>{label}</span>
                            </div>
                            <span style={{ fontSize: 10, color, fontWeight: 600 }}>{status}</span>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,212,255,0.10)", background: "rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Cpu size={10} color="#3D5278" />
                    <span style={{ fontSize: 10.5, color: "#3D5278", letterSpacing: "0.03em" }}>LangChain · FastAPI · SQLite</span>
                </div>
            </div>
        </aside>
    );
}