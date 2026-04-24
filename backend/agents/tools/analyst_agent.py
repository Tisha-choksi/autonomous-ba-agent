import json
import os
from langchain_groq import ChatGroq
from langchain.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from agents.tools.load_data import get_dataframe
from agents.tools.eda import run_eda
from agents.tools.visualization import generate_visualization
from agents.tools.sql_query import execute_pandas_query
from agents.tools.insights import generate_insights
from agents.tools.kpi import calculate_kpis
from agents.tools.forecast import run_forecast
from agents.tools.segmentation import run_segmentation
from agents.tools.data_cleaner import analyze_data_quality, clean_dataframe
from agents.tools.report_generator import generate_pdf_report, generate_excel_report

SYSTEM_PROMPT = """You are an expert Autonomous Business Analyst AI Agent.
You have access to a dataset uploaded by the user.
Your job is to analyze data, generate insights, create visualizations, and answer business questions.

Guidelines:
- Always be specific and data-driven in your answers
- When asked about trends, use the forecast tool
- When asked about groups or segments, use segmentation
- When generating charts, always include image_base64 in your response
- Format numbers properly (commas for thousands, 2 decimal places for currency)
- Provide actionable business recommendations, not just observations
- If the user asks a vague question, infer the most useful analysis and do it

Available tools: eda_analysis, visualize_data, query_data, generate_insights_tool,
calculate_kpis_tool, forecast_data, segment_data, check_data_quality, clean_data,
generate_pdf_report_tool, generate_excel_report_tool
"""

def get_llm():
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        temperature=0,
        max_tokens=4096,
    )

def build_agent_tools(session_id: str):

    @tool
    def eda_analysis(_: str = "") -> str:
        """Run exploratory data analysis on the loaded dataset. Returns statistics, column info, missing values."""
        result = run_eda(session_id)
        return json.dumps(result, default=str)

    @tool
    def visualize_data(params: str) -> str:
        """Generate a chart. Input JSON: {"chart_type": "bar|line|pie|scatter|histogram|heatmap|box", "x_col": "...", "y_col": "...", "title": "..."}"""
        try:
            p = json.loads(params)
        except Exception:
            p = {"chart_type": params}
        result = generate_visualization(session_id, **p)
        return json.dumps(result, default=str)

    @tool
    def query_data(query: str) -> str:
        """Query the dataset using natural language. E.g.: 'top 10 by revenue', 'group by country', 'average sales'"""
        result = execute_pandas_query(session_id, query)
        return json.dumps(result, default=str)

    @tool
    def generate_insights_tool(_: str = "") -> str:
        """Automatically discover insights: trends, anomalies, correlations, data quality issues."""
        result = generate_insights(session_id)
        return json.dumps(result, default=str)

    @tool
    def calculate_kpis_tool(_: str = "") -> str:
        """Calculate key business KPIs: total revenue, avg order value, unique customers, etc."""
        result = calculate_kpis(session_id)
        return json.dumps(result, default=str)

    @tool
    def forecast_data(params: str) -> str:
        """Forecast future values. Input JSON: {"value_col": "column_name", "periods": 12}"""
        try:
            p = json.loads(params)
        except Exception:
            p = {"value_col": params, "periods": 12}
        result = run_forecast(session_id, **p)
        return json.dumps(result, default=str)

    @tool
    def segment_data(params: str = "{}") -> str:
        """Run customer/data segmentation using K-Means clustering. Input JSON: {"n_clusters": 4}"""
        try:
            p = json.loads(params)
        except Exception:
            p = {}
        result = run_segmentation(session_id, **p)
        return json.dumps(result, default=str)

    @tool
    def check_data_quality(_: str = "") -> str:
        """Check data quality: missing values, outliers, duplicates. Returns quality score."""
        result = analyze_data_quality(session_id)
        return json.dumps(result, default=str)

    @tool
    def clean_data(operations: str) -> str:
        """Clean the dataset. Input comma-separated: drop_duplicates, fill_missing_mean, fill_missing_median, fill_missing_mode, drop_missing, remove_outliers"""
        ops = [op.strip() for op in operations.split(",")]
        result = clean_dataframe(session_id, ops)
        return json.dumps(result, default=str)

    @tool
    def generate_pdf_report_tool(_: str = "") -> str:
        """Generate a comprehensive PDF report with EDA, KPIs, insights, and data sample."""
        result = generate_pdf_report(session_id)
        return json.dumps(result, default=str)

    @tool
    def generate_excel_report_tool(_: str = "") -> str:
        """Generate a multi-sheet Excel report with raw data, EDA, KPIs, and insights."""
        result = generate_excel_report(session_id)
        return json.dumps(result, default=str)

    return [
        eda_analysis, visualize_data, query_data,
        generate_insights_tool, calculate_kpis_tool,
        forecast_data, segment_data, check_data_quality,
        clean_data, generate_pdf_report_tool, generate_excel_report_tool,
    ]


class AnalystAgent:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.llm        = get_llm()
        self.tools      = build_agent_tools(session_id)
        self.memory     = MemorySaver()
        self.agent      = create_react_agent(
            self.llm,
            self.tools,
            checkpointer=self.memory,
            state_modifier=SYSTEM_PROMPT,
        )

    def run(self, user_message: str) -> dict:
        config = {"configurable": {"thread_id": self.session_id}}
        result = self.agent.invoke(
            {"messages": [HumanMessage(content=user_message)]},
            config=config,
        )

        last_msg    = result["messages"][-1]
        response_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

        chart_data = None
        tool_used  = None

        for msg in result["messages"]:
            if hasattr(msg, "name") and msg.name:
                tool_used = msg.name
            if hasattr(msg, "content") and isinstance(msg.content, str):
                try:
                    data = json.loads(msg.content)
                    if isinstance(data, dict) and "image_base64" in data:
                        chart_data = data["image_base64"]
                        break
                except Exception:
                    pass

        return {
            "response":   response_text,
            "tool_used":  tool_used,
            "chart_data": chart_data,
        }


# ── Agent registry ────────────────────────────────────────────────────────────
_AGENTS: dict[str, AnalystAgent] = {}

def get_or_create_agent(session_id: str, provider: str = "groq") -> AnalystAgent:
    if session_id not in _AGENTS:
        _AGENTS[session_id] = AnalystAgent(session_id)
    return _AGENTS[session_id]