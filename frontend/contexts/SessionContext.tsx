"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";

interface Session {
    id: string;
    file_name: string;
    rows: number;
    columns: number;
    column_names: string[];
    columns_meta: Record<string, any>;
}

interface SessionContextType {
    session: Session | null;
    sessions: any[];
    setSession: (s: Session | null) => void;
    loadSessions: () => Promise<void>;
    uploadFile: (file: File) => Promise<Session>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);

    const loadSessions = useCallback(async () => {
        const data = await api.getSessions();
        setSessions(data);
    }, []);

    const uploadFile = useCallback(async (file: File): Promise<Session> => {
        const data = await api.uploadFile(file);
        const s: Session = {
            id: data.session_id,
            file_name: data.file_name,
            rows: data.rows,
            columns: data.columns,
            column_names: data.column_names,
            columns_meta: data.columns_meta,
        };
        setSession(s);
        await loadSessions();
        return s;
    }, [loadSessions]);

    return (
        <SessionContext.Provider value={{ session, sessions, setSession, loadSessions, uploadFile }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be inside SessionProvider");
    return ctx;
};