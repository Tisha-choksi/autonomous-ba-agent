import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/contexts/SessionContext";

export const metadata: Metadata = {
    title: "BA Agent — Autonomous Business Analyst",
    description: "AI-powered business intelligence and data analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ background: "#020812", color: "#EEF2FF", minHeight: "100vh" }}>
                <SessionProvider>
                    {/* Animated background */}
                    <div className="grid-bg" />
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />

                    {/* App shell */}
                    <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
                        <Sidebar />
                        <main style={{ flex: 1, marginLeft: 260, minHeight: "100vh" }}>
                            {children}
                        </main>
                    </div>
                </SessionProvider>
            </body>
        </html>
    );
}