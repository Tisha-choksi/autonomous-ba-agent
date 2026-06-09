import numpy as np
import pandas as pd
from .load_data import get_dataframe


def compare_datasets(session_a: str, session_b: str) -> dict:
    df_a = get_dataframe(session_a)
    df_b = get_dataframe(session_b)
    if df_a is None:
        return {"error": f"Dataset A not loaded — upload it first"}
    if df_b is None:
        return {"error": f"Dataset B not loaded — upload it first"}

    cols_a = set(df_a.columns)
    cols_b = set(df_b.columns)
    shared = sorted(cols_a & cols_b)
    only_a = sorted(cols_a - cols_b)
    only_b = sorted(cols_b - cols_a)

    type_mismatches = [
        {"column": c, "type_a": str(df_a[c].dtype), "type_b": str(df_b[c].dtype)}
        for c in shared if str(df_a[c].dtype) != str(df_b[c].dtype)
    ]

    def overview(df: pd.DataFrame) -> dict:
        total_cells = df.size
        missing = int(df.isnull().sum().sum())
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "missing": missing,
            "missing_pct": round(missing / total_cells * 100, 2) if total_cells else 0,
            "duplicates": int(df.duplicated().sum()),
            "memory_kb": round(df.memory_usage(deep=True).sum() / 1024, 1),
        }

    # Shared numeric columns
    num_a = set(df_a.select_dtypes(include=[np.number]).columns)
    num_b = set(df_b.select_dtypes(include=[np.number]).columns)
    shared_numeric = [c for c in shared if c in num_a and c in num_b]

    def _s(val) -> float | None:
        try:
            f = float(val)
            return None if (f != f) else round(f, 4)  # NaN check
        except Exception:
            return None

    # Per-column numeric stats + delta
    stats_diff = []
    for col in shared_numeric[:12]:
        sa, sb = df_a[col].dropna(), df_b[col].dropna()
        mean_a, mean_b = _s(sa.mean()), _s(sb.mean())
        delta_mean_pct = None
        if mean_a is not None and mean_b is not None and mean_a != 0:
            delta_mean_pct = round((mean_b - mean_a) / abs(mean_a) * 100, 1)
        stats_diff.append({
            "column": col,
            "mean_a": mean_a, "mean_b": mean_b, "delta_mean_pct": delta_mean_pct,
            "std_a": _s(sa.std()), "std_b": _s(sb.std()),
            "min_a": _s(sa.min()), "min_b": _s(sb.min()),
            "max_a": _s(sa.max()), "max_b": _s(sb.max()),
            "total_a": _s(sa.sum()), "total_b": _s(sb.sum()),
            "missing_a": int(df_a[col].isnull().sum()),
            "missing_b": int(df_b[col].isnull().sum()),
        })

    # Top-level KPI summary (total & mean for first 8 numeric cols)
    kpi_diff = []
    for col in shared_numeric[:8]:
        total_a, total_b = _s(df_a[col].sum()), _s(df_b[col].sum())
        mean_a, mean_b = _s(df_a[col].mean()), _s(df_b[col].mean())
        def pct(a, b):
            if a is None or b is None or a == 0:
                return None
            return round((b - a) / abs(a) * 100, 1)
        kpi_diff.append({
            "column": col,
            "total_a": total_a, "total_b": total_b, "total_delta_pct": pct(total_a, total_b),
            "mean_a": mean_a, "mean_b": mean_b, "mean_delta_pct": pct(mean_a, mean_b),
        })

    # Categorical value distributions
    cat_a = set(df_a.select_dtypes(include=["object", "category"]).columns)
    cat_b = set(df_b.select_dtypes(include=["object", "category"]).columns)
    shared_cat = [c for c in shared if c in cat_a and c in cat_b]
    cat_diff = []
    for col in shared_cat[:5]:
        vc_a = (df_a[col].value_counts(normalize=True) * 100).head(8).round(1)
        vc_b = (df_b[col].value_counts(normalize=True) * 100).head(8).round(1)
        all_vals = sorted(set(vc_a.index) | set(vc_b.index))
        cat_diff.append({
            "column": col,
            "values": [
                {"name": str(v), "pct_a": round(float(vc_a.get(v, 0)), 1), "pct_b": round(float(vc_b.get(v, 0)), 1)}
                for v in all_vals
            ],
        })

    return {
        "schema": {
            "only_in_a": only_a,
            "only_in_b": only_b,
            "shared": shared,
            "type_mismatches": type_mismatches,
        },
        "overview_a": overview(df_a),
        "overview_b": overview(df_b),
        "kpi_diff": kpi_diff,
        "stats_diff": stats_diff,
        "cat_diff": cat_diff,
    }
