import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64
import io
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from .load_data import get_dataframe

PALETTE = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"]

def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight",
                facecolor="#0F172A", edgecolor="none")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()

def run_segmentation(session_id: str, n_clusters: int = 4,
                     columns: list[str] = None) -> dict:
    df = get_dataframe(session_id)
    if df is None:
        return {"error": "No data loaded"}

    try:
        numeric_df = df.select_dtypes(include=[np.number])
        if columns:
            numeric_df = df[[c for c in columns if c in df.select_dtypes(include=[np.number]).columns]]

        if len(numeric_df.columns) < 2:
            return {"error": "Need at least 2 numeric columns for segmentation"}

        clean_df = numeric_df.dropna()
        scaler = StandardScaler()
        scaled = scaler.fit_transform(clean_df)

        # Optimal clusters (elbow method, max 8)
        max_k = min(8, len(clean_df) - 1)
        inertias = []
        for k in range(2, max_k + 1):
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            km.fit(scaled)
            inertias.append(km.inertia_)

        # Use elbow or requested n_clusters
        n_clusters = min(n_clusters, max_k)
        km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = km.fit_predict(scaled)

        # PCA for 2D visualization
        pca = PCA(n_components=2)
        reduced = pca.fit_transform(scaled)

        plt.style.use("dark_background")
        plt.rcParams.update({
            "figure.facecolor": "#0F172A", "axes.facecolor": "#1E293B",
            "axes.edgecolor": "#334155", "text.color": "#F1F5F9",
            "grid.color": "#334155",
        })

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        fig.patch.set_facecolor("#0F172A")

        # Scatter
        for i in range(n_clusters):
            mask = labels == i
            ax1.scatter(reduced[mask, 0], reduced[mask, 1],
                        c=PALETTE[i % len(PALETTE)], label=f"Segment {i+1}",
                        alpha=0.7, s=25, edgecolors="none")
        ax1.set_title("Customer Segments (PCA)", color="#F1F5F9", pad=10)
        ax1.set_xlabel("PC1"); ax1.set_ylabel("PC2")
        ax1.legend(framealpha=0.3, fontsize=9)
        ax1.grid(True, alpha=0.2)

        # Elbow chart
        ax2.plot(range(2, max_k + 1), inertias, color=PALETTE[0], linewidth=2, marker='o', markersize=5)
        ax2.axvline(x=n_clusters, color=PALETTE[2], linestyle='--', alpha=0.7, label=f"Selected k={n_clusters}")
        ax2.set_title("Elbow Method", color="#F1F5F9", pad=10)
        ax2.set_xlabel("Number of Clusters"); ax2.set_ylabel("Inertia")
        ax2.legend(framealpha=0.3)
        ax2.grid(True, alpha=0.2)

        plt.tight_layout()
        img_b64 = _fig_to_base64(fig)
        plt.close(fig)

        # Segment summaries
        result_df = clean_df.copy()
        result_df["segment"] = labels
        segment_summary = {}
        for i in range(n_clusters):
            seg = result_df[result_df["segment"] == i]
            segment_summary[f"Segment_{i+1}"] = {
                "count": int(len(seg)),
                "pct": round(len(seg) / len(result_df) * 100, 1),
                "means": {col: round(float(seg[col].mean()), 3) for col in clean_df.columns}
            }

        return {
            "n_clusters": n_clusters,
            "total_rows_analyzed": len(clean_df),
            "columns_used": clean_df.columns.tolist(),
            "pca_variance_explained": [round(float(v), 3) for v in pca.explained_variance_ratio_],
            "segment_summary": segment_summary,
            "image_base64": img_b64
        }
    except Exception as e:
        return {"error": str(e)}