import pandas as pd
import numpy as np
from .load_data import get_dataframe, store_dataframe

def analyze_data_quality(session_id: str) -> dict:
    df = get_dataframe(session_id)
    if df is None:
        return {"error": "No data loaded"}

    issues = []
    recommendations = []

    # Missing values
    missing = df.isnull().sum()
    for col in df.columns:
        pct = missing[col] / len(df) * 100
        if pct > 0:
            rec = "Drop column" if pct > 70 else ("Mean/median impute" if df[col].dtype in [np.float64, np.int64] else "Mode impute")
            issues.append({
                "column": col, "issue": "missing_values",
                "count": int(missing[col]), "pct": round(pct, 2), "recommendation": rec
            })

    # Duplicates
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        issues.append({
            "column": "ALL", "issue": "duplicate_rows",
            "count": dup_count, "pct": round(dup_count / len(df) * 100, 2),
            "recommendation": "Remove duplicate rows"
        })

    # Outliers
    for col in df.select_dtypes(include=[np.number]).columns[:10]:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        outlier_count = int(((df[col] < Q1 - 3*IQR) | (df[col] > Q3 + 3*IQR)).sum())
        if outlier_count > 0:
            issues.append({
                "column": col, "issue": "outliers",
                "count": outlier_count, "pct": round(outlier_count / len(df) * 100, 2),
                "recommendation": "Cap outliers at 3-sigma or remove"
            })

    # Mixed types
    for col in df.select_dtypes(include=["object"]).columns:
        numeric_pct = pd.to_numeric(df[col], errors="coerce").notna().sum() / len(df) * 100
        if 10 < numeric_pct < 90:
            issues.append({
                "column": col, "issue": "mixed_types",
                "count": None, "pct": round(numeric_pct, 1),
                "recommendation": f"{round(numeric_pct, 1)}% of values are numeric — consider type conversion"
            })

    quality_score = max(0, 100 - len(issues) * 5)
    return {
        "quality_score": quality_score,
        "total_issues": len(issues),
        "issues": issues,
        "rows": len(df),
        "columns": len(df.columns)
    }

def clean_dataframe(session_id: str, operations: list[str]) -> dict:
    df = get_dataframe(session_id).copy()
    performed = []

    for op in operations:
        op = op.lower()
        if "drop_duplicates" in op or "remove duplicates" in op:
            before = len(df)
            df = df.drop_duplicates()
            performed.append(f"Removed {before - len(df)} duplicate rows")
        elif "fill_missing_mean" in op or "impute mean" in op:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
            performed.append("Filled numeric missing values with column means")
        elif "fill_missing_median" in op:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
            performed.append("Filled numeric missing values with column medians")
        elif "fill_missing_mode" in op:
            for col in df.select_dtypes(include=["object"]).columns:
                mode = df[col].mode()
                if len(mode) > 0:
                    df[col] = df[col].fillna(mode[0])
            performed.append("Filled categorical missing values with column modes")
        elif "drop_missing" in op:
            before = len(df)
            df = df.dropna()
            performed.append(f"Dropped {before - len(df)} rows with any missing values")
        elif "remove_outliers" in op:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
                IQR = Q3 - Q1
                df = df[(df[col] >= Q1 - 3*IQR) & (df[col] <= Q3 + 3*IQR)]
            performed.append("Removed extreme outliers (3-sigma)")

    store_dataframe(session_id, df)
    return {
        "operations_performed": performed,
        "rows_before": len(get_dataframe(session_id)) + sum(
            int(p.split(" ")[1]) for p in performed if p.split(" ")[1].isdigit()
        ) if performed else len(df),
        "rows_after": len(df),
        "new_shape": {"rows": len(df), "cols": len(df.columns)}
    }