import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SessionProvider } from "@/contexts/SessionContext";

export const metadata: Metadata = {
    title: "BA Agent — Autonomous Business Analyst",
    description: "AI-powered business intelligence and data analysis",
    icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <SessionProvider>
                    {/* Animated background */}
                    <div className="grid-bg" />
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />

                    {/* Layout */}
                    <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
                        <Sidebar />
                        <main style={{ flex: 1, marginLeft: "var(--sidebar-w)", minHeight: "100vh", position: "relative" }}>
                            {children}
                        </main>
                    </div>
                </SessionProvider>
            </body>
        </html>
    );
}