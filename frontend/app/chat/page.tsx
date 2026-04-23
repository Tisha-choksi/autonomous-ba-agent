"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "@/contexts/SessionContext";
import { api } from "@/lib/api";
import { ChartRenderer } from "@/components/ChartRenderer";
import { Send, Bot, User, Loader2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

const SUGGESTED_QUERIES = [
    "Give me a complete overview of this dataset",
    "What are the top insights from this data?",
    "Show me a bar chart of sales by category",
    "What is the trend in revenue over time?",
    "Which columns have the most missing data?",
    "Perform customer segmentation",
    "Forecast the next 12 periods",
    "Generate a PDF report",
];

export default function ChatPage() {
    const { session } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!session) return;
        api.getChatHistory(session.id).then(history => {
            setMessages(history.map((m: any) => ({
                role: m.role, content: m.content,
                chart: m.chart_data ? { image_base64: m.chart_data, title: "" } : null,
                tool: m.tool_used
            })));
        });
    }, [session]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const send = async (msg?: string) => {
        const text = msg || input.trim();
        if (!text || !session || loading) return;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: text }]);
        setLoading(true);
        try {
            const res = await api.chat(session.id, text);
            setMessages(prev => [...prev, {
                role: "assistant", content: res.response,
                chart: res.chart_data ? { image_base64: res.chart_data, title: "" } : null,
                tool: res.tool_used
            }]);
        } catch (e: any) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Error: ${e.message}. Please try again.`
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!session) return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <MessageSquare size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No dataset loaded</p>
                <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                    Upload Data
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
                <h1 className="font-semibold text-white">AI Business Analyst Chat</h1>
                <p className="text-xs text-slate-400">{session.file_name} · {session.rows?.toLocaleString()} rows</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <Bot size={48} className="text-blue-400 mx-auto mb-3" />
                            <h2 className="text-xl font-bold text-white mb-2">Ask me anything about your data</h2>
                            <p className="text-slate-400 text-sm">I can analyze, visualize, forecast, segment, and explain your data.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {SUGGESTED_QUERIES.map(q => (
                                <button key={q} onClick={() => send(q)}
                                    className="text-left p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 hover:border-blue-600/50 hover:text-white hover:bg-slate-800 transition-all">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot size={14} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-3xl ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                            {msg.tool && (
                                <span className="text-xs text-blue-400 bg-blue-950/50 border border-blue-800/50 rounded-full px-2 py-0.5">
                                    🔧 {msg.tool}
                                </span>
                            )}
                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                                }`}>
                                {msg.content}
                            </div>
                            {msg.chart && <ChartRenderer chart={msg.chart} className="w-full max-w-2xl" />}
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={14} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3">
                            <Loader2 size={16} className="text-blue-400 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                        placeholder="Ask about your data..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button onClick={() => send()} disabled={!input.trim() || loading}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}