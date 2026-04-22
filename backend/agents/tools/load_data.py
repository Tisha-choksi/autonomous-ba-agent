import pandas as pd
import json
import io
from pathlib import Path
from langchain.tools import tool

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
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def get_columns_meta(df: pd.DataFrame) -> dict:
    meta = {}
    for col in df.columns:
        meta[col] = {
            "dtype": str(df[col].dtype),
            "non_null": int(df[col].notna().sum()),
            "null_count": int(df[col].isna().sum()),
            "unique_count": int(df[col].nunique()),
            "sample": df[col].dropna().head(3).tolist()
        }
    return meta