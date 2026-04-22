import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import base64
import io
import json
from .load_data import get_dataframe

PALETTE = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626",
           "#0891B2", "#9333EA", "#16A34A", "#EA580C", "#1D4ED8"]

def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight",
                facecolor="#0F172A", edgecolor="none")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()

def _set_dark_style():
    plt.style.use("dark_background")
    plt.rcParams.update({
        "figure.facecolor": "#0F172A",
        "axes.facecolor": "#1E293B",
        "axes.edgecolor": "#334155",
        "axes.labelcolor": "#CBD5E1",
        "xtick.color": "#94A3B8",
        "ytick.color": "#94A3B8",
        "text.color": "#F1F5F9",
        "grid.color": "#334155",
        "grid.alpha": 0.5,
    })

def generate_visualization(session_id: str, chart_type: str,
                            x_col: str = None, y_col: str = None,
                            color_col: str = None, title: str = None) -> dict:
    df = get_dataframe(session_id)
    if df is None:
        return {"error": "No data loaded"}

    _set_dark_style()
    
    try:
        fig, ax = plt.subplots(figsize=(10, 5))
        chart_type = chart_type.lower()

        if chart_type == "bar":
            if x_col and y_col:
                data = df.groupby(x_col)[y_col].sum().sort_values(ascending=False).head(15)
                bars = ax.bar(data.index.astype(str), data.values, color=PALETTE[0], edgecolor="#334155", linewidth=0.5)
                ax.set_xlabel(x_col); ax.set_ylabel(y_col)
                plt.xticks(rotation=45, ha="right")
            else:
                return {"error": "bar chart requires x_col and y_col"}

        elif chart_type == "line":
            if x_col and y_col:
                data = df[[x_col, y_col]].dropna().sort_values(x_col)
                ax.plot(data[x_col].astype(str), data[y_col], color=PALETTE[0], linewidth=2, marker='o', markersize=3)
                ax.fill_between(range(len(data)), data[y_col], alpha=0.1, color=PALETTE[0])
                ax.set_xlabel(x_col); ax.set_ylabel(y_col)
                plt.xticks(rotation=45, ha="right")
            else:
                return {"error": "line chart requires x_col and y_col"}

        elif chart_type == "histogram":
            col = x_col or y_col
            if col and col in df.select_dtypes(include=[np.number]).columns:
                ax.hist(df[col].dropna(), bins=30, color=PALETTE[0], edgecolor="#334155", linewidth=0.5)
                ax.set_xlabel(col); ax.set_ylabel("Frequency")
            else:
                return {"error": "histogram requires a numeric column"}

        elif chart_type == "scatter":
            if x_col and y_col:
                scatter_data = df[[x_col, y_col]].dropna()
                ax.scatter(scatter_data[x_col], scatter_data[y_col],
                           color=PALETTE[0], alpha=0.6, s=20, edgecolors="none")
                ax.set_xlabel(x_col); ax.set_ylabel(y_col)
            else:
                return {"error": "scatter requires x_col and y_col"}

        elif chart_type == "pie":
            col = x_col or color_col
            val_col = y_col
            if col:
                if val_col:
                    data = df.groupby(col)[val_col].sum().head(8)
                else:
                    data = df[col].value_counts().head(8)
                wedges, texts, autotexts = ax.pie(
                    data.values, labels=data.index.astype(str),
                    colors=PALETTE[:len(data)], autopct='%1.1f%%',
                    startangle=90, pctdistance=0.8
                )
                for t in autotexts: t.set_color("white"); t.set_fontsize(9)
            else:
                return {"error": "pie chart requires x_col"}

        elif chart_type == "heatmap":
            numeric_df = df.select_dtypes(include=[np.number])
            if len(numeric_df.columns) < 2:
                return {"error": "Need at least 2 numeric columns for heatmap"}
            plt.close(fig)
            fig, ax = plt.subplots(figsize=(10, 8))
            fig.patch.set_facecolor("#0F172A")
            ax.set_facecolor("#1E293B")
            corr = numeric_df.corr()
            sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm",
                        ax=ax, linewidths=0.5, linecolor="#334155",
                        annot_kws={"size": 9})
            ax.set_title(title or "Correlation Heatmap", color="#F1F5F9", pad=15)
            img_b64 = _fig_to_base64(fig)
            plt.close(fig)
            return {"chart_type": chart_type, "image_base64": img_b64, "title": title or "Correlation Heatmap"}

        elif chart_type == "box":
            col = y_col or x_col
            if col and col in df.select_dtypes(include=[np.number]).columns:
                if x_col and x_col != col:
                    groups = [grp[col].dropna().values for _, grp in df.groupby(x_col)]
                    labels = df[x_col].unique()[:10].astype(str)
                    bp = ax.boxplot(groups[:10], labels=labels, patch_artist=True)
                    for patch, color in zip(bp['boxes'], PALETTE):
                        patch.set_facecolor(color); patch.set_alpha(0.7)
                else:
                    bp = ax.boxplot(df[col].dropna(), patch_artist=True)
                    bp['boxes'][0].set_facecolor(PALETTE[0]); bp['boxes'][0].set_alpha(0.7)
                ax.set_ylabel(col)
            else:
                return {"error": "box plot requires a numeric column"}

        else:
            return {"error": f"Unknown chart type: {chart_type}. Use: bar, line, histogram, scatter, pie, heatmap, box"}

        ax.set_title(title or f"{chart_type.title()} Chart", color="#F1F5F9", pad=15, fontsize=13)
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        img_b64 = _fig_to_base64(fig)
        plt.close(fig)

        return {
            "chart_type": chart_type,
            "image_base64": img_b64,
            "title": title or f"{chart_type.title()} Chart",
            "x_col": x_col,
            "y_col": y_col
        }

    except Exception as e:
        plt.close('all')
        return {"error": str(e)}