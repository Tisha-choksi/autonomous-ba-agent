import os
import uuid
import json
import shutil
import asyncio
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from db.sqlite_manager import (init_db, create_session, get_session, get_all_sessions,
                                 save_chat, get_chat_history, save_insight, get_insights,
                                 save_report, get_reports, save_kpis, delete_session)
from agents.tools.load_data import load_file_to_df, store_dataframe, get_columns_meta, get_dataframe
from agents.tools.eda import run_eda
from agents.tools.kpi import calculate_kpis
from agents.tools.insights import generate_insights
from agents.tools.visualization import generate_visualization
from agents.tools.data_cleaner import analyze_data_quality
from agents.analyst_agent import get_or_create_agent

STORAGE_PATH = Path(os.getenv("STORAGE_PATH", "./storage"))
EXPORTS_PATH = Path(os.getenv("EXPORTS_PATH", "./exports"))
STORAGE_PATH.mkdir(parents=True, exist_ok=True)
EXPORTS_PATH.mkdir(parents=True, exist_ok=True)

init_db()

app = FastAPI(title="Autonomous Business Analyst Agent API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

# ─── Schemas ────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str
    provider: str = "groq"

class VizRequest(BaseModel):
    session_id: str
    chart_type: str
    x_col: Optional[str] = None
    y_col: Optional[str] = None
    color_col: Optional[str] = None
    title: Optional[str] = None

class CleanRequest(BaseModel):
    session_id: str
    operations: list[str]

class ForecastRequest(BaseModel):
    session_id: str
    value_col: str
    periods: int = 12

class SegmentRequest(BaseModel):
    session_id: str
    n_clusters: int = 4
    columns: Optional[list[str]] = None


# ─── Upload ──────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("csv", "xlsx", "xls", "json", "txt"):
        raise HTTPException(400, "Unsupported file type. Use CSV, Excel, or JSON.")

    file_path = STORAGE_PATH / f"{session_id}.{ext}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    df = load_file_to_df(str(file_path), ext)
    store_dataframe(session_id, df)
    columns_meta = get_columns_meta(df)

    create_session(session_id, file.filename, str(file_path), file.filename,
                   ext, len(df), len(df.columns), columns_meta)

    # Run initial analysis in background
    eda = run_eda(session_id)
    kpis = calculate_kpis(session_id)
    insights = generate_insights(session_id)

    if kpis:
        save_kpis(session_id, kpis)
    for ins in insights:
        if "title" in ins:
            save_insight(session_id, ins.get("type",""), ins["title"],
                         ins.get("description",""), ins.get("severity","info"))

    return {
        "session_id": session_id,
        "file_name": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "columns_meta": columns_meta,
        "eda_summary": eda,
        "kpis": kpis,
        "insights": insights
    }

# ─── Sessions ────────────────────────────────────────────────────────────────

@app.get("/api/sessions")
def list_sessions():
    return get_all_sessions()

@app.get("/api/sessions/{session_id}")
def get_session_info(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session

@app.delete("/api/sessions/{session_id}")
def remove_session(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    file_path = Path(session.get("file_path", ""))
    if file_path.exists():
        file_path.unlink()
    delete_session(session_id)
    return {"deleted": True}

# ─── Reload session data ──────────────────────────────────────────────────────

@app.post("/api/sessions/{session_id}/reload")
def reload_session(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if get_dataframe(session_id) is None:
        df = load_file_to_df(session["file_path"], session["file_type"])
        store_dataframe(session_id, df)
    return {"reloaded": True, "rows": len(get_dataframe(session_id))}

# ─── EDA ─────────────────────────────────────────────────────────────────────

@app.get("/api/eda/{session_id}")
def get_eda(session_id: str):
    _ensure_data(session_id)
    return run_eda(session_id)

# ─── KPIs ────────────────────────────────────────────────────────────────────

@app.get("/api/kpis/{session_id}")
def get_kpis(session_id: str):
    _ensure_data(session_id)
    kpis = calculate_kpis(session_id)
    save_kpis(session_id, kpis)
    return kpis

# ─── Insights ────────────────────────────────────────────────────────────────

@app.get("/api/insights/{session_id}")
def get_insights_endpoint(session_id: str):
    _ensure_data(session_id)
    return get_insights(session_id)  # from DB

@app.post("/api/insights/{session_id}/refresh")
def refresh_insights(session_id: str):
    _ensure_data(session_id)
    return generate_insights(session_id)

# ─── Visualization ───────────────────────────────────────────────────────────

@app.post("/api/visualize")
def create_visualization(req: VizRequest):
    _ensure_data(req.session_id)
    return generate_visualization(req.session_id, req.chart_type,
                                   req.x_col, req.y_col, req.color_col, req.title)

# ─── Data Explorer ───────────────────────────────────────────────────────────

@app.get("/api/data/{session_id}")
def get_data_preview(session_id: str, page: int = 1, page_size: int = 50,
                     search: str = None, sort_col: str = None, sort_desc: bool = False):
    _ensure_data(session_id)
    import pandas as pd
    df = get_dataframe(session_id)
    if search:
        mask = df.astype(str).apply(lambda col: col.str.contains(search, case=False)).any(axis=1)
        df = df[mask]
    if sort_col and sort_col in df.columns:
        df = df.sort_values(sort_col, ascending=not sort_desc)
    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end]
    import numpy as np
    records = []
    for _, row in page_df.iterrows():
        rec = {}
        for col in row.index:
            v = row[col]
            if isinstance(v, (np.integer,)): rec[col] = int(v)
            elif isinstance(v, (np.floating,)): rec[col] = None if np.isnan(v) else round(float(v), 4)
            else: rec[col] = None if (hasattr(v, '__class__') and v.__class__.__name__ == 'float' and str(v) == 'nan') else str(v) if v != v else None
        records.append(rec)
    return {"total": total, "page": page, "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
            "columns": df.columns.tolist(), "data": records}

# ─── Data Quality ────────────────────────────────────────────────────────────

@app.get("/api/quality/{session_id}")
def get_data_quality(session_id: str):
    _ensure_data(session_id)
    return analyze_data_quality(session_id)

@app.post("/api/clean")
def clean_data_endpoint(req: CleanRequest):
    _ensure_data(req.session_id)
    from agents.tools.data_cleaner import clean_dataframe
    return clean_dataframe(req.session_id, req.operations)

# ─── Forecast ────────────────────────────────────────────────────────────────

@app.post("/api/forecast")
def forecast_endpoint(req: ForecastRequest):
    _ensure_data(req.session_id)
    from agents.tools.forecast import run_forecast
    return run_forecast(req.session_id, req.value_col, periods=req.periods)

# ─── Segmentation ────────────────────────────────────────────────────────────

@app.post("/api/segment")
def segment_endpoint(req: SegmentRequest):
    _ensure_data(req.session_id)
    from agents.tools.segmentation import run_segmentation
    return run_segmentation(req.session_id, req.n_clusters, req.columns)

# ─── Chat ────────────────────────────────────────────────────────────────────

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    _ensure_data(req.session_id)
    save_chat(req.session_id, "user", req.message)
    agent = get_or_create_agent(req.session_id, req.provider)
    result = agent.run(req.message)
    save_chat(req.session_id, "assistant", result["response"],
              result.get("tool_used"), result.get("chart_data"))
    return result

@app.get("/api/chat/{session_id}/history")
def get_history(session_id: str, limit: int = 50):
    return get_chat_history(session_id, limit)

# ─── Reports ────────────────────────────────────────────────────────────────

@app.post("/api/reports/pdf/{session_id}")
def create_pdf_report(session_id: str):
    _ensure_data(session_id)
    result = generate_pdf_report(session_id)
    if "error" in result:
        raise HTTPException(400, result["error"])
    save_report(session_id, "pdf", result["file_path"], result["file_name"])
    return result

@app.post("/api/reports/excel/{session_id}")
def create_excel_report(session_id: str):
    _ensure_data(session_id)
    from agents.tools.report_generator import generate_excel_report
    result = generate_excel_report(session_id)
    if "error" in result:
        raise HTTPException(400, result["error"])
    save_report(session_id, "excel", result["file_path"], result["file_name"])
    return result

@app.get("/api/reports/download/{file_name}")
def download_report(file_name: str):
    file_path = EXPORTS_PATH / file_name
    if not file_path.exists():
        raise HTTPException(404, "Report not found")
    media_type = "application/pdf" if file_name.endswith(".pdf") else \
                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return FileResponse(str(file_path), media_type=media_type,
                        filename=file_name)

@app.get("/api/reports/{session_id}")
def list_reports(session_id: str):
    return get_reports(session_id)

# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# ─── Helper ──────────────────────────────────────────────────────────────────

def _ensure_data(session_id: str):
    if get_dataframe(session_id) is None:
        session = get_session(session_id)
        if not session:
            raise HTTPException(404, f"Session '{session_id}' not found")
        try:
            df = load_file_to_df(session["file_path"], session["file_type"])
            store_dataframe(session_id, df)
        except Exception as e:
            raise HTTPException(500, f"Failed to reload data: {e}")

# ─── Paste Raw Text ──────────────────────────────────────────────────────────

class PasteRequest(BaseModel):
    raw_text: str
    fmt: str = "csv"          # "csv" or "json"
    name: str = "pasted_data"

@app.post("/api/upload/paste")
def upload_paste(req: PasteRequest):
    from agents.tools.load_data import load_from_text
    session_id = str(uuid.uuid4())
    try:
        df = load_from_text(req.raw_text, req.fmt)
    except Exception as e:
        raise HTTPException(400, f"Could not parse pasted data: {e}")

    store_dataframe(session_id, df)
    columns_meta = get_columns_meta(df)
    create_session(session_id, req.name, "", req.name, req.fmt,
                   len(df), len(df.columns), columns_meta)

    eda = run_eda(session_id)
    kpis = calculate_kpis(session_id)
    insights = generate_insights(session_id)
    if kpis: save_kpis(session_id, kpis)
    for ins in insights:
        if "title" in ins:
            save_insight(session_id, ins.get("type",""), ins["title"],
                         ins.get("description",""), ins.get("severity","info"))

    return {"session_id": session_id, "file_name": req.name, "rows": len(df),
            "columns": len(df.columns), "column_names": df.columns.tolist(),
            "columns_meta": columns_meta, "eda_summary": eda, "kpis": kpis, "insights": insights}


# ─── URL Scrape ───────────────────────────────────────────────────────────────

class URLRequest(BaseModel):
    url: str

@app.post("/api/upload/url")
def upload_from_url(req: URLRequest):
    from agents.tools.load_data import load_from_url
    session_id = str(uuid.uuid4())
    try:
        df, source_desc = load_from_url(req.url)
    except Exception as e:
        raise HTTPException(400, f"Could not load from URL: {e}")

    name = req.url.split("/")[-1].split("?")[0] or "scraped_data"
    store_dataframe(session_id, df)
    columns_meta = get_columns_meta(df)
    create_session(session_id, name, req.url, name, "url",
                   len(df), len(df.columns), columns_meta)

    eda = run_eda(session_id)
    kpis = calculate_kpis(session_id)
    insights = generate_insights(session_id)
    if kpis: save_kpis(session_id, kpis)
    for ins in insights:
        if "title" in ins:
            save_insight(session_id, ins.get("type",""), ins["title"],
                         ins.get("description",""), ins.get("severity","info"))

    return {"session_id": session_id, "file_name": name, "source": source_desc,
            "rows": len(df), "columns": len(df.columns),
            "column_names": df.columns.tolist(), "columns_meta": columns_meta,
            "eda_summary": eda, "kpis": kpis, "insights": insights}


# ─── SQLite DB File ───────────────────────────────────────────────────────────

@app.post("/api/upload/sqlite")
async def upload_sqlite(file: UploadFile = File(...), table_name: str = None):
    from agents.tools.load_data import load_sqlite_file, get_sqlite_tables
    if not file.filename.endswith(".db"):
        raise HTTPException(400, "Only .db (SQLite) files accepted")

    session_id = str(uuid.uuid4())
    db_path = STORAGE_PATH / f"{session_id}.db"
    with open(db_path, "wb") as f:
        f.write(await file.read())

    # List tables first
    try:
        tables = get_sqlite_tables(str(db_path))
    except Exception as e:
        raise HTTPException(400, f"Invalid SQLite file: {e}")

    try:
        df = load_sqlite_file(str(db_path), table_name)
    except Exception as e:
        raise HTTPException(400, str(e))

    store_dataframe(session_id, df)
    columns_meta = get_columns_meta(df)
    create_session(session_id, file.filename, str(db_path), file.filename, "db",
                   len(df), len(df.columns), columns_meta)

    eda = run_eda(session_id)
    kpis = calculate_kpis(session_id)
    insights = generate_insights(session_id)
    if kpis: save_kpis(session_id, kpis)
    for ins in insights:
        if "title" in ins:
            save_insight(session_id, ins.get("type",""), ins["title"],
                         ins.get("description",""), ins.get("severity","info"))

    return {"session_id": session_id, "file_name": file.filename,
            "available_tables": tables, "loaded_table": table_name or "(largest)",
            "rows": len(df), "columns": len(df.columns),
            "column_names": df.columns.tolist(), "columns_meta": columns_meta,
            "eda_summary": eda, "kpis": kpis, "insights": insights}

@app.get("/api/sqlite/tables")
async def get_sqlite_tables_endpoint(file: UploadFile = File(...)):
    """Preview tables in a SQLite file before loading."""
    from agents.tools.load_data import get_sqlite_tables
    tmp_path = STORAGE_PATH / f"tmp_{uuid.uuid4()}.db"
    with open(tmp_path, "wb") as f:
        f.write(await file.read())
    try:
        tables = get_sqlite_tables(str(tmp_path))
    finally:
        tmp_path.unlink(missing_ok=True)
    return {"tables": tables}