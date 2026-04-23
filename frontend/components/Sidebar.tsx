"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, MessageSquare, Lightbulb, Table2,
  FileDown, Brain, Upload, ChevronRight
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";

const NAV_ITEMS = [
  { href: "/", icon: Upload, label: "Upload Data" },
  { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/insights", icon: Lightbulb, label: "Insights" },
  { href: "/explorer", icon: Table2, label: "Data Explorer" },
  { href: "/reports", icon: FileDown, label: "Reports" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">BA Agent</div>
            <div className="text-xs text-slate-400">Business Analyst AI</div>
          </div>
        </div>
      </div>

      {/* Active Session */}
      {session && (
        <div className="mx-3 mt-3 p-3 bg-blue-950/50 border border-blue-800/50 rounded-lg">
          <div className="text-xs text-blue-400 font-medium mb-1">Active Dataset</div>
          <div className="text-sm text-white truncate font-medium">{session.file_name}</div>
          <div className="text-xs text-slate-400 mt-1">
            {session.rows?.toLocaleString()} rows · {session.columns} cols
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 mt-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${
                active
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <Icon size={16} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Powered by Groq · LangChain · FastAPI
      </div>
    </aside>
  );
}