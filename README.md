# 🤖 Autonomous Business Analyst Agent

AI-powered business intelligence platform. Upload data → get instant insights, visualizations, forecasts, and natural language Q&A.

## Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4
- **Backend**: FastAPI, LangChain, LangGraph
- **LLM**: Groq (LLaMA-3.3-70b) — free tier
- **Database**: SQLite (zero setup)
- **Charts**: Matplotlib + Seaborn
- **Reports**: ReportLab (PDF) + openpyxl (Excel)

## Features
- 📊 Auto dashboard with KPI cards and charts
- 🤖 AI agent with 11 tools (EDA, viz, forecast, segment, clean, report...)
- 💬 Natural language chat interface
- 💡 Auto-discovered insights (trends, anomalies, correlations)
- 📋 Data explorer with search + sort + pagination
- 📄 One-click PDF and Excel report generation
- 🔮 Time series forecasting
- 🎯 Customer segmentation (K-Means)

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Deploy
- **Frontend**: Vercel (connect GitHub repo)
- **Backend**: Render (free tier, connect GitHub repo, set env vars)

## Groq API Key
Get free at: https://console.groq.com