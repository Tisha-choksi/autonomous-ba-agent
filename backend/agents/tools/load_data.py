import pandas as pd
import numpy as np
import json
import io
import sqlite3
import requests
from pathlib import Path
from bs4 import BeautifulSoup

# Global in-memory store: session_id -> DataFrame
_DATA_STORE: dict[str, pd.DataFrame] = {}

def store_dataframe(session_id: str, df: pd.DataFrame):
    _DATA_STORE[session_id] = df

def get_dataframe(session_id: str) -> pd.DataFrame | None:
    return _DATA_STORE.get(session_id)

def load_file_to_df(file_path: str, file_type: str) -> pd.DataFrame:
    path = Path(file_path)
    if file_type in ("csv", "txt"):
        return pd.read_csv(path)
    elif file_type in ("xlsx", "xls"):
        return pd.read_excel(path)
    elif file_type == "json":
        return pd.read_json(path)
    elif file_type == "db":
        return load_sqlite_file(str(path))
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def load_from_text(raw_text: str, fmt: str = "csv") -> pd.DataFrame:
    """Load from pasted raw text — CSV or JSON string."""
    text = raw_text.strip()
    if fmt == "json" or (text.startswith("{") or text.startswith("[")):
        data = json.loads(text)
        if isinstance(data, list):
            return pd.DataFrame(data)
        elif isinstance(data, dict):
            # Try records format, or single-level dict of columns
            if any(isinstance(v, list) for v in data.values()):
                return pd.DataFrame(data)
            return pd.DataFrame([data])
    # Default: CSV
    return pd.read_csv(io.StringIO(text))

def load_from_url(url: str) -> tuple[pd.DataFrame, str]:
    """
    Scrape a URL and return (DataFrame, source_description).
    Tries: direct CSV/JSON download → HTML tables → structured list extraction.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; BAAgent/1.0)"
    }
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()

    content_type = resp.headers.get("content-type", "")

    # Direct CSV
    if "text/csv" in content_type or url.lower().endswith(".csv"):
        df = pd.read_csv(io.StringIO(resp.text))
        return df, "CSV from URL"

    # Direct JSON
    if "application/json" in content_type or url.lower().endswith(".json"):
        data = resp.json()
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            # Try to find the data array in common API response shapes
            for key in ["data", "results", "items", "records", "rows"]:
                if key in data and isinstance(data[key], list):
                    df = pd.DataFrame(data[key])
                    break
            else:
                df = pd.json_normalize(data)
        return df, "JSON API"

    # Excel
    if url.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(resp.content))
        return df, "Excel from URL"

    # HTML: try pandas read_html first (handles <table> tags)
    try:
        tables = pd.read_html(io.StringIO(resp.text))
        if tables:
            # Pick the largest table
            df = max(tables, key=len)
            return df, f"HTML table ({len(tables)} table(s) found)"
    except Exception:
        pass

    # Fallback: scrape structured data with BeautifulSoup
    soup = BeautifulSoup(resp.text, "lxml")
    rows = []

    # Try <ul>/<li> lists
    lists = soup.find_all("ul", limit=5)
    for ul in lists:
        items = [li.get_text(strip=True) for li in ul.find_all("li") if li.get_text(strip=True)]
        if len(items) > 3:
            rows.extend([{"item": item} for item in items])
            if len(rows) > 200:
                break

    if rows:
        return pd.DataFrame(rows), "Scraped list items"

    raise ValueError(
        "Could not extract tabular data from this URL. "
        "Supported: direct CSV/JSON/Excel links, pages with HTML tables, or list-structured pages."
    )

def load_sqlite_file(db_path: str, table_name: str = None) -> pd.DataFrame:
    """Load the largest table from a SQLite .db file, or a specific table."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    if not tables:
        raise ValueError("No tables found in SQLite database")
    if table_name and table_name in tables:
        chosen = table_name
    else:
        # Pick table with most rows
        chosen = tables[0]
        max_rows = 0
        for t in tables:
            count = conn.execute(f"SELECT COUNT(*) FROM \"{t}\"").fetchone()[0]
            if count > max_rows:
                max_rows = count
                chosen = t
    df = pd.read_sql(f'SELECT * FROM "{chosen}"', conn)
    conn.close()
    return df

def get_sqlite_tables(db_path: str) -> list[dict]:
    """List all tables and their row counts in a SQLite DB."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    result = []
    for t in tables:
        count = conn.execute(f"SELECT COUNT(*) FROM \"{t}\"").fetchone()[0]
        cols = conn.execute(f"PRAGMA table_info(\"{t}\")").fetchall()
        result.append({"table": t, "rows": count, "columns": len(cols)})
    conn.close()
    return result

def get_columns_meta(df: pd.DataFrame) -> dict:
    meta = {}
    for col in df.columns:
        meta[col] = {
            "dtype": str(df[col].dtype),
            "non_null": int(df[col].notna().sum()),
            "null_count": int(df[col].isna().sum()),
            "unique_count": int(df[col].nunique()),
            "sample": [str(x) for x in df[col].dropna().head(3).tolist()]
        }
    return meta