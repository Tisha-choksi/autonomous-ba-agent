"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { ChartRenderer } from "@/components/ChartRenderer";
import { Send, Bot, User, Loader2, MessageSquare, Zap, BarChart3, TrendingUp, Sparkles, ChevronRight, Clock, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
    { icon: BarChart3, label: "Full overview", q: "Give me a complete analysis overview of this dataset" },
    { icon: Sparkles, label: "Top insights", q: "What are the most important insights from this data?" },
    { icon: TrendingUp, label: "Trends", q: "Show me trend analysis and key patterns" },
    { icon: Zap, label: "Bar chart", q: "Create a bar chart for the most important categorical column" },
    { icon: BarChart3, label: "Correlation", q: "Show correlation heatmap between all numeric columns" },
    { icon: TrendingUp, label: "Forecast", q: "Forecast the next 12 periods for the main numeric column" },
    { icon: Sparkles, label: "Segmentation", q: "Perform customer segmentation with 4 clusters" },
    { icon: Zap, label: "Generate PDF", q: "Generate a comprehensive PDF report" },
];

const PHASES = ["Thinking...", "Selecting tool...", "Running analysis...", "Generating response..."];

interface Msg { role: "user" | "assistant"; content: string; chart?: any; tool?: string; ts?: string; }

export default function ChatPage() {
    const { session } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState("Thinking...");
    const bottomRef = useRef<HTMLDivElement>(null);
    const taRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!session) return;
        api.getChatHistory(session.id).then(h => setMessages(h.map((m: any) => ({ role: m.role, content: m.content, chart: m.chart_data ? { image_base64: m.chart_data } : null, tool: m.tool_used, ts: m.created_at }))));
    }, [session]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

    useEffect(() => {
        if (!loading) return;
        let i = 0;
        const iv = setInterval(() => { i = (i + 1) % PHASES.length; setPhase(PHASES[i]); }, 1200);
        return () => clearInterval(iv);
    }, [loading]);

    const send = useCallback(async (msg?: string) => {
        const text = (msg || input).trim();
        if (!text || !session || loading) return;
        setInput("");
        setMessages(p => [...p, { role: "user", content: text, ts: new Date().toISOString() }]);
        setLoading(true);
        try {
            const res = await api.chat(session.id, text);
            setMessages(p => [...p, { role: "assistant", content: res.response, chart: res.chart_data ? { image_base64: res.chart_data } : null, tool: res.tool_used, ts: new Date().toISOString() }]);
        } catch (e: any) {
            setMessages(p => [...p, { role: "assistant", content: `⚠️ ${e.message}` }]);
        } finally { setLoading(false); }
    }, [input, session, loading]);

    const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const fmt = (ts?: string) => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

    if (!session) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="anim-scale-in" style={{ padding: "56px 64px", textAlign: "center", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 20 }}>
                <MessageSquare size={40} color="#3D5278" style={{ margin: "0 auto 16px", display: "block" }} />
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#EEF2FF", marginBottom: 8 }}>No Dataset</div>
                <p style={{ fontSize: 13.5, color: "#3D5278", marginBottom: 24 }}>Upload a file to start chatting</p>
                <button onClick={() => router.push("/")} style={{ padding: "10px 24px", fontSize: 13, fontWeight: 600, background: "linear-gradient(135deg,#00D4FF,#0099CC)", color: "#020812", border: "none", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <Upload size={13} /> Upload Data
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

            {/* Header */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(0,212,255,0.09)", background: "rgba(4,10,22,0.95)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#00D4FF,#7C5CFC)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bot size={14} color="#020812" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, color: "#EEF2FF" }}>AI Business Analyst</span>
                        <span style={{ padding: "2px 9px", fontSize: 10, background: "rgba(0,255,148,0.09)", border: "1px solid rgba(0,255,148,0.25)", color: "#00FF94", borderRadius: 100, fontWeight: 500 }}>● ONLINE</span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#3D5278" }}>{session.file_name} · {session.rows?.toLocaleString()} rows</div>
                </div>
                <div style={{ fontSize: 11, color: "#3D5278", display: "flex", alignItems: "center", gap: 5 }}>
                    <MessageSquare size={11} />{messages.length} messages
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                {messages.length === 0 ? (
                    <div style={{ maxWidth: 640, margin: "0 auto" }}>
                        <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
                            <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,rgba(0,212,255,0.12),rgba(124,92,252,0.08))", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid rgba(0,212,255,0.2)" }}>
                                <Bot size={30} color="#00D4FF" />
                            </div>
                            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: "#EEF2FF", marginBottom: 8 }}>Ask me anything about your data</h2>
                            <p style={{ fontSize: 13.5, color: "#3D5278", lineHeight: 1.6 }}>I can analyze patterns, create charts, forecast trends, segment customers, and generate reports.</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {SUGGESTIONS.map(({ icon: Icon, label, q }, i) => (
                                <button key={q} onClick={() => send(q)} className="anim-fade-up"
                                    style={{ padding: "13px 15px", textAlign: "left", cursor: "pointer", background: "rgba(8,18,38,0.85)", border: "1px solid rgba(0,212,255,0.09)", borderRadius: 14, display: "flex", alignItems: "center", gap: 10, animationDelay: `${i * 55}ms`, transition: "border-color 0.2s" }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,212,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Icon size={13} color="#00D4FF" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "#EEF2FF", marginBottom: 2 }}>{label}</div>
                                        <div style={{ fontSize: 11, color: "#3D5278", lineHeight: 1.3 }}>{q.slice(0, 44)}...</div>
                                    </div>
                                    <ChevronRight size={12} color="#3D5278" style={{ marginLeft: "auto", flexShrink: 0 }} />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
                        {messages.map((msg, i) => (
                            <div key={i} className="anim-fade-up" style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: msg.role === "assistant" ? "linear-gradient(135deg,#00D4FF,#7C5CFC)" : "linear-gradient(135deg,#1e3a5f,#2d4a7a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, border: `1px solid ${msg.role === "assistant" ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                                    {msg.role === "assistant" ? <Bot size={15} color="#020812" strokeWidth={2.5} /> : <User size={14} color="#EEF2FF" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                                    {msg.tool && <span style={{ padding: "2px 9px", fontSize: 10, background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.25)", color: "#7C5CFC", borderRadius: 100, fontWeight: 500 }}>🔧 {msg.tool.replace(/_/g, " ")}</span>}
                                    <div className={msg.role === "user" ? "chat-user" : "chat-assistant"} style={{ padding: "11px 15px", fontSize: 13.5, lineHeight: 1.65, color: "#EEF2FF", maxWidth: "85%", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                        {msg.content}
                                    </div>
                                    {msg.chart?.image_base64 && <div style={{ width: "100%", maxWidth: 560 }}><ChartRenderer chart={msg.chart} /></div>}
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#3D5278" }}><Clock size={9} />{fmt(msg.ts)}</div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="anim-fade-in" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#00D4FF,#7C5CFC)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Bot size={15} color="#020812" strokeWidth={2.5} />
                                </div>
                                <div className="chat-assistant" style={{ padding: "14px 18px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            {[0, 1, 2].map(j => <div key={j} className="typing-dot" style={{ animationDelay: `${j * 0.2}s` }} />)}
                                        </div>
                                        <span style={{ fontSize: 12, color: "#3D5278" }}>{phase}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                )}
                {messages.length > 0 && <div ref={bottomRef} />}
            </div>

            {/* Input */}
            <div style={{ padding: "14px 24px 18px", borderTop: "1px solid rgba(0,212,255,0.09)", background: "rgba(4,10,22,0.95)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
                <div style={{ maxWidth: 760, margin: "0 auto" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(8,18,38,0.9)", border: `1px solid ${input.trim() ? "rgba(0,212,255,0.3)" : "rgba(0,212,255,0.10)"}`, borderRadius: 14, padding: "10px 10px 10px 16px", transition: "border-color 0.25s", boxShadow: input.trim() ? "0 0 20px rgba(0,212,255,0.08)" : "none" }}>
                        <textarea ref={taRef} value={input}
                            onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                            onKeyDown={onKey}
                            placeholder="Ask about your data... (Enter to send, Shift+Enter for new line)"
                            rows={1}
                            style={{ flex: 1, background: "transparent", border: "none", color: "#EEF2FF", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, lineHeight: 1.5, resize: "none", outline: "none", maxHeight: 120, overflowY: "auto" }}
                        />
                        <button onClick={() => send()} disabled={!input.trim() || loading}
                            style={{ width: 38, height: 38, padding: 0, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#00D4FF,#0099CC)", border: "none", cursor: "pointer", opacity: (!input.trim() || loading) ? 0.4 : 1, transition: "opacity 0.25s" }}>
                            {loading ? <Loader2 size={15} color="#020812" style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} color="#020812" />}
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {["Overview", "Top insights", "Show chart", "Forecast", "PDF report"].map(q => (
                            <button key={q} onClick={() => send(q)} style={{ padding: "4px 12px", fontSize: 11.5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.10)", borderRadius: 100, cursor: "pointer", color: "#3D5278", transition: "all 0.2s" }}>
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}