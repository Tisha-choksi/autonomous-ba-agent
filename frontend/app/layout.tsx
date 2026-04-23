import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/contexts/SessionContext";

export const metadata: Metadata = {
    title: "BA Agent — Autonomous Business Analyst",
    description: "AI-powered business intelligence and data analysis",
};

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    background: #020812 !important;
    scroll-behavior: smooth;
  }

  body {
    background: #020812 !important;
    color: #EEF2FF !important;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.25); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,212,255,0.45); }

  /* ── Keyframes ── */
  @keyframes gridShift {
    0%   { background-position: 0 0; }
    100% { background-position: 60px 60px; }
  }
  @keyframes orbFloat {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(20px,-30px) scale(1.06); }
    66%      { transform: translate(-15px,20px) scale(0.94); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.93); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulseRing {
    0%   { transform: scale(0.9); opacity: 0.7; }
    50%  { transform: scale(1.3); opacity: 0.1; }
    100% { transform: scale(0.9); opacity: 0.7; }
  }
  @keyframes scanLine {
    0%   { top: -2px; }
    100% { top: 100%; }
  }
  @keyframes typingDot {
    0%,60%,100% { transform: translateY(0); opacity: 0.4; }
    30%          { transform: translateY(-7px); opacity: 1; }
  }
  @keyframes borderGlow {
    0%,100% { box-shadow: 0 0 0 1px rgba(0,212,255,0.15), 0 0 20px rgba(0,212,255,0.06); }
    50%      { box-shadow: 0 0 0 1px rgba(0,212,255,0.35), 0 0 40px rgba(0,212,255,0.14); }
  }

  /* ── Animation classes ── */
  .anim-fade-up  { animation: fadeUp   0.55s cubic-bezier(0.4,0,0.2,1) both; }
  .anim-fade-in  { animation: fadeIn   0.4s ease both; }
  .anim-scale-in { animation: scaleIn  0.45s cubic-bezier(0.4,0,0.2,1) both; }
  .anim-glow     { animation: borderGlow 3s ease-in-out infinite; }

  .delay-1 { animation-delay: 0.07s; }
  .delay-2 { animation-delay: 0.14s; }
  .delay-3 { animation-delay: 0.22s; }
  .delay-4 { animation-delay: 0.30s; }
  .delay-5 { animation-delay: 0.38s; }
  .delay-6 { animation-delay: 0.46s; }
  .delay-7 { animation-delay: 0.54s; }
  .delay-8 { animation-delay: 0.62s; }

  /* ── Grid background ── */
  .grid-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      linear-gradient(rgba(0,212,255,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.045) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: gridShift 22s linear infinite;
  }

  /* ── Orbs ── */
  .orb {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
  .orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 68%);
    top: -160px; right: -160px;
    animation: orbFloat 10s ease-in-out infinite;
  }
  .orb-2 {
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(124,92,252,0.09) 0%, transparent 68%);
    bottom: 40px; left: -100px;
    animation: orbFloat 13s ease-in-out infinite;
    animation-delay: -4.5s;
  }
  .orb-3 {
    width: 340px; height: 340px;
    background: radial-gradient(circle, rgba(0,255,148,0.05) 0%, transparent 68%);
    top: 42%; left: 46%;
    animation: orbFloat 9s ease-in-out infinite;
    animation-delay: -7s;
  }

  /* ── Skeleton ── */
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 25%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.03) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 10px;
  }

  /* ── Status dot ── */
  .status-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #00FF94;
    position: relative;
    display: inline-block;
    flex-shrink: 0;
  }
  .status-dot::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: #00FF94;
    opacity: 0.22;
    animation: pulseRing 2.2s ease infinite;
  }

  /* ── Scan line ── */
  .scan-line {
    position: absolute;
    left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #00D4FF 50%, transparent);
    animation: scanLine 3s linear infinite;
    pointer-events: none;
  }

  /* ── Text gradient ── */
  .text-gradient {
    background: linear-gradient(135deg, #00D4FF 0%, #7C5CFC 55%, #00FF94 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Sidebar link ── */
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 13.5px;
    color: #3D5278;
    text-decoration: none;
    transition: background 0.2s ease, color 0.2s ease;
    position: relative;
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }
  .sidebar-link:hover  { color: #8BA3C7; background: rgba(255,255,255,0.04); }
  .sidebar-link.active { color: #00D4FF; background: rgba(0,212,255,0.10); font-weight: 500; }
  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; height: 60%; width: 2.5px;
    background: #00D4FF;
    border-radius: 0 3px 3px 0;
    box-shadow: 0 0 12px #00D4FF;
  }

  /* ── Chat bubbles ── */
  .chat-user {
    background: linear-gradient(135deg,rgba(0,212,255,0.13),rgba(124,92,252,0.08));
    border: 1px solid rgba(0,212,255,0.22);
    border-radius: 18px 18px 4px 18px;
  }
  .chat-assistant {
    background: rgba(8,18,38,0.9);
    border: 1px solid rgba(0,212,255,0.09);
    border-radius: 18px 18px 18px 4px;
  }

  /* ── Typing dot ── */
  .typing-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #00D4FF;
    animation: typingDot 1.3s ease infinite;
  }

  /* ── Data table ── */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th {
    font-size: 11px; font-weight: 500; color: #3D5278;
    text-transform: uppercase; letter-spacing: 0.07em;
    padding: 10px 14px; text-align: left;
    border-bottom: 1px solid rgba(0,212,255,0.08);
    position: sticky; top: 0; background: #060f1e; z-index: 10;
  }
  .data-table td {
    padding: 9px 14px; font-size: 12.5px; color: #8BA3C7;
    border-bottom: 1px solid rgba(0,212,255,0.04);
    font-family: 'JetBrains Mono', monospace;
  }
  .data-table tr:hover td { background: rgba(0,212,255,0.03); color: #EEF2FF; }

  /* ── Progress bar ── */
  .progress-bar {
    height: 3px; background: rgba(0,212,255,0.1);
    border-radius: 100px; overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00D4FF, #7C5CFC);
    border-radius: 100px;
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" style={{ background: "#020812" }}>
            <head>
                <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ background: "#020812", color: "#EEF2FF", minHeight: "100vh" }}>
                <SessionProvider>
                    <div className="grid-bg" />
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />

                    <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
                        <Sidebar />
                        <main style={{
                            flex: 1,
                            marginLeft: 260,
                            minHeight: "100vh",
                            background: "transparent",
                            position: "relative",
                        }}>
                            {children}
                        </main>
                    </div>
                </SessionProvider>
            </body>
        </html>
    );
}