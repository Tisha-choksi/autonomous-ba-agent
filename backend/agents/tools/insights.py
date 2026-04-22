import pandas as pd
import numpy as np
from scipy import stats
from .load_data import get_dataframe

def generate_insights(session_id: str) -> list[dict]:
    df = get_dataframe(session_id)
    if df is None:
        return [{"error": "No data loaded"}]

    insights = []
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # 1. Missing data insights
    missing = df.isnull().sum()
    high_missing = {col: int(missing[col]) for col in df.columns if missing[col] / len(df) > 0.1}
    if high_missing:
        worst = max(high_missing, key=high_missing.get)
        pct = round(high_missing[worst] / len(df) * 100, 1)
        insights.append({
            "type": "data_quality",
            "title": f"High Missing Data in '{worst}'",
            "description": f"Column '{worst}' has {high_missing[worst]} missing values ({pct}% of rows). Consider imputation or removal.",
            "severity": "warning",
            "affected_columns": list(high_missing.keys())
        })

    # 2. Outlier insights
    for col in numeric_cols[:8]:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        outlier_mask = (df[col] < Q1 - 3*IQR) | (df[col] > Q3 + 3*IQR)
        n_outliers = outlier_mask.sum()
        if n_outliers > 0 and n_outliers / len(df) > 0.02:
            insights.append({
                "type": "outlier",
                "title": f"Significant Outliers in '{col}'",
                "description": f"{n_outliers} extreme outliers detected ({round(n_outliers/len(df)*100, 1)}%). Max: {round(df[col].max(), 2)}, Min: {round(df[col].min(), 2)}.",
                "severity": "info",
                "column": col
            })

    # 3. Skewness
    for col in numeric_cols[:8]:
        skew = df[col].skew()
        if abs(skew) > 2:
            direction = "right" if skew > 0 else "left"
            insights.append({
                "type": "distribution",
                "title": f"Highly Skewed Distribution: '{col}'",
                "description": f"'{col}' is {direction}-skewed (skewness={round(skew, 2)}). Log transformation may improve analysis.",
                "severity": "info",
                "column": col
            })

    # 4. Strong correlations
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr()
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                c = corr.iloc[i, j]
                if abs(c) > 0.75:
                    direction = "positive" if c > 0 else "negative"
                    insights.append({
                        "type": "correlation",
                        "title": f"Strong {direction.title()} Correlation",
                        "description": f"'{numeric_cols[i]}' and '{numeric_cols[j]}' have a strong {direction} correlation of {round(c, 3)}.",
                        "severity": "success",
                        "columns": [numeric_cols[i], numeric_cols[j]]
                    })

    # 5. Dominant categories
    for col in cat_cols[:5]:
        vc = df[col].value_counts(normalize=True)
        if vc.iloc[0] > 0.5:
            insights.append({
                "type": "distribution",
                "title": f"Dominant Category in '{col}'",
                "description": f"'{vc.index[0]}' dominates '{col}' with {round(vc.iloc[0]*100, 1)}% of all records.",
                "severity": "info",
                "column": col
            })

    # 6. High cardinality
    for col in cat_cols[:5]:
        cardinality = df[col].nunique()
        if cardinality > len(df) * 0.8:
            insights.append({
                "type": "data_quality",
                "title": f"High Cardinality Column: '{col}'",
                "description": f"'{col}' has {cardinality} unique values ({round(cardinality/len(df)*100, 1)}% of rows). Likely an ID or text field.",
                "severity": "warning",
                "column": col
            })

    # 7. Trend detection (if sorted numeric data)
    for col in numeric_cols[:5]:
        series = df[col].dropna().reset_index(drop=True)
        if len(series) > 20:
            half = len(series) // 2
            first_half_mean = series[:half].mean()
            second_half_mean = series[half:].mean()
            pct_change = ((second_half_mean - first_half_mean) / (abs(first_half_mean) + 1e-10)) * 100
            if abs(pct_change) > 20:
                direction = "increasing" if pct_change > 0 else "decreasing"
                insights.append({
                    "type": "trend",
                    "title": f"Trend Detected in '{col}'",
                    "description": f"'{col}' shows a {direction} trend: {round(pct_change, 1)}% change from first half to second half of dataset.",
                    "severity": "success" if pct_change > 0 else "warning",
                    "column": col
                })

    return insights[:15]  # Top 15 insights