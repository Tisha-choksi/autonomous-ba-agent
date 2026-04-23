"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3, MessageSquare, Lightbulb, Table2,
    FileDown, Upload, Brain, Cpu, ChevronRight,
    Database, Activity
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";

const NAV = [
    { href: "/", icon: Upload, label: "Data Source", desc: "Load dataset" },
    { href: "/dashboard", icon: BarChart3, label: "Dashboard", desc: "KPIs & charts" },
    { href: "/chat", icon: MessageSquare, label: "AI Chat", desc: "Ask questions" },
    { href: "/insights", icon: Lightbulb, label: "Insights", desc: "Auto-analysis" },
    { href: "/explorer", icon: Table2, label: "Explorer", desc: "Browse data" },
    { href: "/reports", icon: FileDown, label: "Reports", desc: "PDF & Excel" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { session } = useSession();

    return (
        <aside style={{
            position: "fixed",
            left: 0, top: 0,
            width: "var(--sidebar-w)",
            height: "100vh",
            background: "linear-gradient(180deg, #060f1e 0%, #040b18 100%)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
            backdropFilter: "blur(20px)",
        }}>
            {/* Logo */}
            <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36,
                        background: "linear-gradient(135deg, #00D4FF, #7C5CFC)",
                        borderRadius: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
                        flexShrink: 0,
                    }}>
                        <Brain size={18} color="#020812" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.01em",
                        }}>
                            BA Agent
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                            BUSINESS ANALYST AI
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Session Card */}
            {session ? (
                <div style={{
                    margin: "12px 12px 0",
                    padding: "10px 12px",
                    background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,92,252,0.06))",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    borderRadius: 10,
                    animation: "fadeIn 0.4s ease",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div className="status-dot" />
                        <span style={{ fontSize: 10, color: "var(--cyan)", fontWeight: 500, letterSpacing: "0.05em" }}>
                            ACTIVE DATASET
                        </span>
                    </div>
                    <div style={{
                        fontSize: 12.5,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 4,
                    }}>
                        {session.file_name}
                    </div>
                    <div style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        display: "flex",
                        gap: 8,
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Database size={9} />
                            {session.rows?.toLocaleString()} rows
                        </span>
                        <span style={{ color: "var(--border)" }}>·</span>
                        <span>{session.columns} cols</span>
                    </div>
                </div>
            ) : (
                <div style={{
                    margin: "12px 12px 0",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px dashed var(--border)",
                    borderRadius: 10,
                }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                        No dataset loaded
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", padding: "0 6px 8px", fontWeight: 500 }}>
                    NAVIGATION
                </div>
                {NAV.map(({ href, icon: Icon, label, desc }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href} style={{ textDecoration: "none", display: "block", marginBottom: 2 }}>
                            <div className={`sidebar-link ${active ? "active" : ""}`}>
                                <div style={{
                                    width: 30, height: 30,
                                    borderRadius: 8,
                                    background: active ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                    transition: "all 0.2s ease",
                                }}>
                                    <Icon size={14} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13.5, fontWeight: active ? 500 : 400 }}>{label}</div>
                                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}>{desc}</div>
                                </div>
                                {active && <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />}
                            </div>
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="divider" style={{ margin: "12px 6px" }} />

                {/* AI Status */}
                <div style={{ padding: "0 6px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 500 }}>
                        AI STATUS
                    </div>
                    {[
                        { label: "LangGraph Agent", status: "Ready", color: "var(--green)" },
                        { label: "Groq LLaMA-3.3", status: "Online", color: "var(--cyan)" },
                        { label: "11 Tools", status: "Loaded", color: "var(--purple)" },
                    ].map(({ label, status, color }) => (
                        <div key={label} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "5px 4px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Activity size={10} color={color} />
                                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{label}</span>
                            </div>
                            <span style={{ fontSize: 10, color, fontWeight: 500 }}>{status}</span>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
                background: "rgba(0,0,0,0.2)",
            }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    justifyContent: "center",
                }}>
                    <Cpu size={10} color="var(--text-muted)" />
                    <span style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.03em" }}>
                        LangChain · FastAPI · SQLite
                    </span>
                </div>
            </div>
        </aside>
    );
}