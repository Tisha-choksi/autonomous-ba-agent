"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { ChartRenderer } from "@/components/ChartRenderer";
import {
    Send, Bot, User, Loader2, MessageSquare,
    Zap, BarChart3, TrendingUp, Sparkles,
    Upload, ChevronRight, Clock, Wrench
} from "lucide-react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
    { icon: BarChart3, label: "Full overview", q: "Give me a complete analysis overview of this dataset" },
    { icon: Sparkles, label: "Top insights", q: "What are the most important insights from this data?" },
    { icon: TrendingUp, label: "Trends", q: "Show me trend analysis and key patterns" },
    { icon: Zap, label: "Bar chart", q: "Create a bar chart for the most important categorical column" },
    { icon: BarChart3, label: "Correlation", q: "Show correlation heatmap between all numeric columns" },
    { icon: TrendingUp, label: "Forecast", q: "Forecast the next 12 periods for the main numeric column" },
    { icon: Sparkles, label: "Segmentation", q: "Perform customer segmentation with 4 clusters" },
    { icon: Zap, label: "Generate PDF report", q: "Generate a comprehensive PDF report" },
];

interface Message {
    role: "user" | "assistant";
    content: string;
    chart?: any;
    tool?: string;
    ts?: string;
}

export default function ChatPage() {
    const { session } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState("Thinking...");
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const LOADING_PHASES = [
        "Thinking...", "Selecting tool...", "Running analysis...", "Generating response..."
    ];

    useEffect(() => {
        if (!session) return;
        api.getChatHistory(session.id).then(history => {
            setMessages(history.map((m: any) => ({
                role: m.role, content: m.content,
                chart: m.chart_data ? { image_base64: m.chart_data } : null,
                tool: m.tool_used,
                ts: m.created_at,
            })));
        });
    }, [session]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (!loading) return;
        let i = 0;
        const iv = setInterval(() => {
            i = (i + 1) % LOADING_PHASES.length;
            setLoadingPhase(LOADING_PHASES[i]);
        }, 1200);
        return () => clearInterval(iv);
    }, [loading]);

    const send = useCallback(async (msg?: string) => {
        const text = (msg || input).trim();
        if (!text || !session || loading) return;
        setInput("");
        const userMsg: Message = { role: "user", content: text, ts: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        setLoadingPhase("Thinking...");
        try {
            const res = await api.chat(session.id, text);
            const assistantMsg: Message = {
                role: "assistant", content: res.response,
                chart: res.chart_data ? { image_base64: res.chart_data } : null,
                tool: res.tool_used,
                ts: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (e: any) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `⚠️ Error: ${e.message}. Please try again.`,
            }]);
        } finally { setLoading(false); }
    }, [input, session, loading]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const formatTime = (ts?: string) => {
        if (!ts) return "";
        return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="glass-card anim-scale-in" style={{ padding: "56px 64px", textAlign: "center", maxWidth: 380 }}>
                <MessageSquare size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                    No Dataset
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 24 }}>Upload a file to start chatting</p>
                <button className="btn-primary" onClick={() => router.push("/")} style={{ padding: "10px 24px", fontSize: 13 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Upload size={13} /> Upload Data
                    </span>
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

            {/* Header */}
            <div style={{
                padding: "14px 24px",
                borderBottom: "1px solid var(--border)",
                background: "rgba(6, 15, 30, 0.9)",
                backdropFilter: "blur(20px)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0,
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{
                            width: 28, height: 28,
                            background: "linear-gradient(135deg, var(--cyan), var(--purple))",
                            borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Bot size={14} color="#020812" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                            AI Business Analyst
                        </span>
                        <span className="badge badge-green" style={{ fontSize: 10 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                            ONLINE
                        </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                        {session.file_name} · {session.rows?.toLocaleString()} rows
                    </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <MessageSquare size={11} />
                    {messages.length} messages
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                {messages.length === 0 ? (
                    <div style={{ maxWidth: 640, margin: "0 auto" }}>
                        {/* Welcome */}
                        <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
                            <div style={{
                                width: 64, height: 64,
                                background: "linear-gradient(135deg, var(--cyan-dim), var(--purple-dim))",
                                borderRadius: 18,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 16px",
                                border: "1px solid rgba(0,212,255,0.2)",
                            }}>
                                <Bot size={30} color="var(--cyan)" />
                            </div>
                            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                                Ask me anything about your data
                            </h2>
                            <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
                                I can analyze patterns, create charts, forecast trends,<br />
                                segment customers, and generate reports.
                            </p>
                        </div>

                        {/* Suggestions */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {SUGGESTIONS.map(({ icon: Icon, label, q }, i) => (
                                <button key={q} onClick={() => send(q)}
                                    className="glass-card anim-fade-up"
                                    style={{
                                        padding: "13px 15px",
                                        textAlign: "left", cursor: "pointer",
                                        border: "1px solid var(--border)",
                                        background: "none",
                                        animationDelay: `${i * 60}ms`,
                                        transition: "all 0.25s ease",
                                        display: "flex", alignItems: "center", gap: 10,
                                    }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8,
                                        background: "var(--cyan-dim)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={13} color="var(--cyan)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{label}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>{q.slice(0, 44)}...</div>
                                    </div>
                                    <ChevronRight size={12} color="var(--text-muted)" style={{ marginLeft: "auto", flexShrink: 0 }} />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
                        {messages.map((msg, i) => (
                            <div key={i} className="anim-fade-up"
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                                    alignItems: "flex-start",
                                }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 32, height: 32,
                                    borderRadius: msg.role === "assistant" ? 10 : 10,
                                    background: msg.role === "assistant"
                                        ? "linear-gradient(135deg, var(--cyan), var(--purple))"
                                        : "linear-gradient(135deg, #1e3a5f, #2d4a7a)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                    border: `1px solid ${msg.role === "assistant" ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                                    marginTop: 2,
                                }}>
                                    {msg.role === "assistant"
                                        ? <Bot size={15} color="#020812" strokeWidth={2.5} />
                                        : <User size={14} color="var(--text-primary)" />}
                                </div>

                                <div style={{
                                    flex: 1, minWidth: 0,
                                    display: "flex", flexDirection: "column",
                                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                                    gap: 8,
                                }}>
                                    {/* Tool badge */}
                                    {msg.tool && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <span className="badge badge-purple" style={{ fontSize: 10 }}>
                                                <Wrench size={9} />
                                                {msg.tool.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div className={msg.role === "user" ? "chat-user" : "chat-assistant"}
                                        style={{
                                            padding: "11px 15px",
                                            fontSize: 13.5, lineHeight: 1.65,
                                            color: "var(--text-primary)",
                                            maxWidth: "85%",
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                        }}>
                                        {msg.content}
                                    </div>

                                    {/* Chart */}
                                    {msg.chart?.image_base64 && (
                                        <div style={{ width: "100%", maxWidth: 560 }}>
                                            <ChartRenderer chart={msg.chart} />
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--text-muted)" }}>
                                        <Clock size={9} />
                                        {formatTime(msg.ts)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading bubble */}
                        {loading && (
                            <div className="anim-fade-up" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    background: "linear-gradient(135deg, var(--cyan), var(--purple))",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <Bot size={15} color="#020812" strokeWidth={2.5} />
                                </div>
                                <div className="chat-assistant" style={{ padding: "14px 18px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            {[0, 1, 2].map(j => (
                                                <div key={j} style={{
                                                    width: 6, height: 6, borderRadius: "50%",
                                                    background: "var(--cyan)",
                                                    animation: "typingDot 1.2s ease infinite",
                                                    animationDelay: `${j * 0.2}s`,
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{loadingPhase}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                )}
                {messages.length > 0 && <div ref={bottomRef} />}
            </div>

            {/* Input Area */}
            <div style={{
                padding: "14px 24px 18px",
                borderTop: "1px solid var(--border)",
                background: "rgba(6, 15, 30, 0.95)",
                backdropFilter: "blur(20px)",
                flexShrink: 0,
            }}>
                <div style={{ maxWidth: 760, margin: "0 auto" }}>
                    <div style={{
                        display: "flex", gap: 10, alignItems: "flex-end",
                        background: "var(--bg-card)",
                        border: `1px solid ${input.trim() ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                        borderRadius: 14,
                        padding: "10px 10px 10px 16px",
                        transition: "border-color 0.25s ease",
                        boxShadow: input.trim() ? "0 0 20px rgba(0,212,255,0.08)" : "none",
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => {
                                setInput(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your data... (Enter to send, Shift+Enter for new line)"
                            rows={1}
                            style={{
                                flex: 1, background: "transparent", border: "none",
                                color: "var(--text-primary)", fontFamily: "var(--font-body)",
                                fontSize: 13.5, lineHeight: 1.5,
                                resize: "none", outline: "none",
                                maxHeight: 120, overflowY: "auto",
                            }}
                        />
                        <button
                            onClick={() => send()}
                            disabled={!input.trim() || loading}
                            className="btn-primary"
                            style={{
                                width: 38, height: 38, padding: 0,
                                borderRadius: 10, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: (!input.trim() || loading) ? 0.4 : 1,
                                transition: "all 0.25s ease",
                            }}>
                            {loading
                                ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                                : <Send size={15} />}
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {["Overview", "Top insights", "Show chart", "Forecast", "PDF report"].map(q => (
                            <button key={q} onClick={() => send(q)}
                                className="btn-ghost"
                                style={{ padding: "4px 10px", fontSize: 11, borderRadius: 100 }}>
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}