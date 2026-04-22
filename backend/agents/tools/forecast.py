import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64
import io
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings("ignore")
from .load_data import get_dataframe

PALETTE = ["#2563EB", "#7C3AED", "#059669"]

def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight",
                facecolor="#0F172A", edgecolor="none")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()

def run_forecast(session_id: str, value_col: str, date_col: str = None,
                 periods: int = 12) -> dict:
    df = get_dataframe(session_id)
    if df is None:
        return {"error": "No data loaded"}

    try:
        if value_col not in df.columns:
            return {"error": f"Column '{value_col}' not found"}

        series = df[value_col].dropna()
        if len(series) < 12:
            return {"error": "Need at least 12 data points for forecasting"}

        # Exponential Smoothing forecast
        model = ExponentialSmoothing(series, trend='add', seasonal=None)
        fit = model.fit(optimized=True)
        forecast = fit.forecast(periods)

        # Build chart
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
        })

        fig, ax = plt.subplots(figsize=(12, 5))
        fig.patch.set_facecolor("#0F172A")

        x_hist = range(len(series))
        x_fore = range(len(series), len(series) + periods)

        ax.plot(x_hist, series.values, color=PALETTE[0], linewidth=2, label="Historical")
        ax.plot(x_fore, forecast.values, color=PALETTE[2], linewidth=2,
                linestyle="--", label=f"Forecast ({periods} periods)")
        ax.fill_between(x_fore,
                        forecast.values * 0.9,
                        forecast.values * 1.1,
                        alpha=0.2, color=PALETTE[2], label="Confidence Band (±10%)")
        ax.axvline(x=len(series)-1, color="#94A3B8", linestyle=":", alpha=0.7)
        ax.set_title(f"Forecast: {value_col}", color="#F1F5F9", pad=15, fontsize=13)
        ax.set_xlabel("Period"); ax.set_ylabel(value_col)
        ax.legend(framealpha=0.3)
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        img_b64 = _fig_to_base64(fig)
        plt.close(fig)

        return {
            "column": value_col,
            "historical_points": len(series),
            "forecast_periods": periods,
            "forecast_values": [round(float(v), 4) for v in forecast.values],
            "last_actual": round(float(series.iloc[-1]), 4),
            "forecast_mean": round(float(forecast.mean()), 4),
            "growth_estimate_pct": round(
                (forecast.mean() - series.mean()) / (abs(series.mean()) + 1e-10) * 100, 2
            ),
            "image_base64": img_b64
        }
    except Exception as e:
        return {"error": str(e)}