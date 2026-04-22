import pandas as pd
import numpy as np
import json
from .load_data import get_dataframe

def execute_pandas_query(session_id: str, query: str) -> dict:
    """
    Accepts natural language or pandas-style queries.
    E.g.: "top 10 customers by revenue", "filter where country == 'India'"
    """
    df = get_dataframe(session_id)
    if df is None:
        return {"error": "No data loaded"}

    try:
        # Direct eval for pandas expressions
        result = df.query(query) if " == " in query or " > " in query or " < " in query else None

        if result is None:
            # Handle common patterns
            q = query.lower().strip()

            if "top" in q and ("by" in q or "sort" in q):
                parts = q.split()
                n = next((int(p) for p in parts if p.isdigit()), 10)
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                sort_col = None
                for word in parts:
                    if word in df.columns:
                        sort_col = word
                        break
                if not sort_col and len(numeric_cols) > 0:
                    sort_col = numeric_cols[0]
                if sort_col:
                    result = df.nlargest(n, sort_col)
                else:
                    result = df.head(n)

            elif q.startswith("group by") or "group by" in q:
                words = q.replace("group by", "").split()
                group_col = next((w for w in words if w in df.columns), None)
                if group_col:
                    numeric_cols = df.select_dtypes(include=[np.number]).columns
                    result = df.groupby(group_col)[numeric_cols].sum().reset_index()
                else:
                    result = df.head(20)

            elif "count" in q or "how many" in q:
                result = pd.DataFrame({"total_rows": [len(df)],
                                       "columns": [len(df.columns)]})

            elif "average" in q or "mean" in q or "avg" in q:
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                result = df[numeric_cols].mean().reset_index()
                result.columns = ["column", "mean_value"]

            elif "sum" in q or "total" in q:
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                result = df[numeric_cols].sum().reset_index()
                result.columns = ["column", "total"]

            elif "unique" in q or "distinct" in q:
                for word in q.split():
                    if word in df.columns:
                        result = pd.DataFrame({word: df[word].unique()})
                        break
                if result is None:
                    result = pd.DataFrame({col: [df[col].nunique()] for col in df.columns},
                                          index=["unique_count"])

            else:
                # Fallback: first 20 rows
                result = df.head(20)

        # Serialize
        result_dict = result.head(100).to_dict(orient="records")
        # Convert numpy types
        for row in result_dict:
            for k, v in row.items():
                if isinstance(v, (np.integer,)): row[k] = int(v)
                elif isinstance(v, (np.floating,)): row[k] = round(float(v), 4)
                elif pd.isna(v) if not isinstance(v, (list, dict)) else False: row[k] = None

        return {
            "query": query,
            "rows_returned": len(result_dict),
            "columns": result.columns.tolist(),
            "data": result_dict
        }

    except Exception as e:
        return {"error": str(e), "query": query}