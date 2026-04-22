import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "ba_agent.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            name TEXT,
            created_at TEXT,
            updated_at TEXT,
            file_path TEXT,
            file_name TEXT,
            file_type TEXT,
            row_count INTEGER,
            col_count INTEGER,
            columns_meta TEXT
        );
        
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            tool_used TEXT,
            chart_data TEXT,
            created_at TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
        
        CREATE TABLE IF NOT EXISTS insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            insight_type TEXT,
            title TEXT,
            description TEXT,
            severity TEXT,
            chart_data TEXT,
            created_at TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
        
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            report_type TEXT,
            file_path TEXT,
            file_name TEXT,
            created_at TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
        
        CREATE TABLE IF NOT EXISTS kpi_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            kpis TEXT,
            created_at TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        );
    """)
    conn.commit()
    conn.close()

def create_session(session_id: str, name: str, file_path: str, file_name: str,
                   file_type: str, row_count: int, col_count: int, columns_meta: dict):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO sessions VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (session_id, name, now, now, file_path, file_name, file_type,
          row_count, col_count, json.dumps(columns_meta)))
    conn.commit()
    conn.close()

def get_session(session_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM sessions WHERE id=?", (session_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_sessions():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM sessions ORDER BY updated_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_chat(session_id: str, role: str, content: str,
              tool_used: str = None, chart_data: str = None):
    conn = get_connection()
    conn.execute("""
        INSERT INTO chat_history (session_id, role, content, tool_used, chart_data, created_at)
        VALUES (?,?,?,?,?,?)
    """, (session_id, role, content, tool_used, chart_data, datetime.utcnow().isoformat()))
    conn.execute("UPDATE sessions SET updated_at=? WHERE id=?",
                 (datetime.utcnow().isoformat(), session_id))
    conn.commit()
    conn.close()

def get_chat_history(session_id: str, limit: int = 50):
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM chat_history WHERE session_id=?
        ORDER BY created_at DESC LIMIT ?
    """, (session_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]

def save_insight(session_id: str, insight_type: str, title: str,
                 description: str, severity: str, chart_data: str = None):
    conn = get_connection()
    conn.execute("""
        INSERT INTO insights (session_id, insight_type, title, description, severity, chart_data, created_at)
        VALUES (?,?,?,?,?,?,?)
    """, (session_id, insight_type, title, description, severity, chart_data,
          datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

def get_insights(session_id: str):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM insights WHERE session_id=? ORDER BY created_at DESC",
                        (session_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_report(session_id: str, report_type: str, file_path: str, file_name: str):
    conn = get_connection()
    conn.execute("""
        INSERT INTO reports (session_id, report_type, file_path, file_name, created_at)
        VALUES (?,?,?,?,?)
    """, (session_id, report_type, file_path, file_name, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

def get_reports(session_id: str):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM reports WHERE session_id=?", (session_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_kpis(session_id: str, kpis: dict):
    conn = get_connection()
    conn.execute("""
        INSERT INTO kpi_snapshots (session_id, kpis, created_at) VALUES (?,?,?)
    """, (session_id, json.dumps(kpis), datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

def delete_session(session_id: str):
    conn = get_connection()
    for tbl in ["chat_history", "insights", "reports", "kpi_snapshots", "sessions"]:
        conn.execute(f"DELETE FROM {tbl} WHERE {'id' if tbl == 'sessions' else 'session_id'}=?",
                     (session_id,))
    conn.commit()
    conn.close()