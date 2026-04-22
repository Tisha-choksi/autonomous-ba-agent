import pandas as pd
import numpy as np
from .load_data import get_dataframe

def calculate_kpis(session_id: str) -> dict:
    df = get_dataframe(session_id)
    if df is None:
        return {"error": "No data loaded"}

    kpis = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # Basic volume KPIs
    kpis["total_records"] = {"value": len(df), "label": "Total Records", "format": "number"}
    kpis["total_columns"] = {"value": len(df.columns), "label": "Total Columns", "format": "number"}
    kpis["data_completeness"] = {
        "value": round((1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100, 1),
        "label": "Data Completeness %", "format": "percent"
    }

    # Revenue/value KPIs (look for amount-like columns)
    revenue_keywords = ["revenue", "sales", "amount", "total", "price", "value", "income", "profit"]
    for col in numeric_cols:
        col_lower = col.lower()
        if any(kw in col_lower for kw in revenue_keywords):
            kpis[f"total_{col.lower().replace(' ','_')}"] = {
                "value": round(float(df[col].sum()), 2),
                "label": f"Total {col}", "format": "currency"
            }
            kpis[f"avg_{col.lower().replace(' ','_')}"] = {
                "value": round(float(df[col].mean()), 2),
                "label": f"Avg {col}", "format": "currency"
            }
            kpis[f"max_{col.lower().replace(' ','_')}"] = {
                "value": round(float(df[col].max()), 2),
                "label": f"Max {col}", "format": "currency"
            }

    # Customer KPIs
    customer_keywords = ["customer", "client", "user", "buyer", "account"]
    for col in cat_cols:
        if any(kw in col.lower() for kw in customer_keywords):
            kpis["unique_customers"] = {
                "value": int(df[col].nunique()),
                "label": "Unique Customers", "format": "number"
            }

    # Quantity KPIs
    qty_keywords = ["quantity", "qty", "units", "count", "orders"]
    for col in numeric_cols:
        if any(kw in col.lower() for kw in qty_keywords):
            kpis[f"total_{col.lower()}"] = {
                "value": round(float(df[col].sum()), 0),
                "label": f"Total {col}", "format": "number"
            }

    # Generic numeric KPIs for all numeric cols
    for col in numeric_cols[:5]:
        if col not in [k.replace("total_", "").replace("avg_", "") for k in kpis]:
            kpis[f"sum_{col.lower().replace(' ','_')[:20]}"] = {
                "value": round(float(df[col].sum()), 2),
                "label": f"Sum of {col}", "format": "number"
            }

    return kpis