import pandas as pd
import numpy as np
import json
from .load_data import get_dataframe

def run_eda(session_id: str) -> dict:
    df = get_dataframe(session_id)
    if df is None:
        return {"error": "No data loaded for this session"}

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    datetime_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()

    # Try to detect datetime from object cols
    for col in categorical_cols:
        try:
            pd.to_datetime(df[col], infer_datetime_format=True)
            datetime_cols.append(col)
        except:
            pass

    # Basic stats
    stats = {}
    if numeric_cols:
        desc = df[numeric_cols].describe().to_dict()
        stats["numeric_summary"] = {
            col: {k: round(float(v), 4) if not np.isnan(v) else None
                  for k, v in vals.items()}
            for col, vals in desc.items()
        }

    # Missing values
    missing = df.isnull().sum()
    missing_pct = (missing / len(df) * 100).round(2)
    missing_info = {
        col: {"count": int(missing[col]), "pct": float(missing_pct[col])}
        for col in df.columns if missing[col] > 0
    }

    # Duplicate rows
    duplicate_count = int(df.duplicated().sum())

    # Categorical value counts (top 10)
    cat_summary = {}
    for col in categorical_cols[:10]:
        vc = df[col].value_counts().head(10)
        cat_summary[col] = {str(k): int(v) for k, v in vc.items()}

    # Outliers (IQR method)
    outliers = {}
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        n_outliers = int(((df[col] < lower) | (df[col] > upper)).sum())
        if n_outliers > 0:
            outliers[col] = {"count": n_outliers, "lower_bound": round(float(lower), 4),
                             "upper_bound": round(float(upper), 4)}

    return {
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "columns": {
            "all": df.columns.tolist(),
            "numeric": numeric_cols,
            "categorical": categorical_cols,
            "datetime": datetime_cols
        },
        "stats": stats,
        "missing_values": missing_info,
        "duplicates": duplicate_count,
        "categorical_summary": cat_summary,
        "outliers": outliers,
        "memory_usage_kb": round(df.memory_usage(deep=True).sum() / 1024, 2)
    }