"""
InfraVision Sustainability Intelligence API
Production-Grade FastAPI Application
"""
import asyncio
import sys
import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.dirname(__file__))

from database import init_db
from routers.ml_router import router as ml_router
from routers.simulation_router import router as sim_router
from routers.other_routers import opt_router, rec_router, alerts_router
from routers.ai_router import router as ai_router
from config import ALL_ZONES

# ─── Legacy compatibility router (keep old endpoints working) ────
from fastapi import APIRouter
import pandas as pd
from pathlib import Path
from config import DATA_DIR, ALL_ZONES
import httpx

legacy = APIRouter(tags=["Legacy"])

def _load_legacy_df():
    paths = [
        DATA_DIR / "expanded_sustainability_delhi.csv",
        Path(__file__).parent.parent / "expanded_sustainable_resource_management_delhi.csv",
    ]
    for p in paths:
        if p.exists():
            df = pd.read_csv(p)
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            return df
    return pd.DataFrame()


@legacy.get("/data/overview")
def legacy_overview(year: int = Query(2022)):
    df = _load_legacy_df()
    if df.empty:
        return {"error": "No data"}
    d = df[df["year"] == year]
    if d.empty:
        d = df[df["year"] == df["year"].max()]
    totals = d[["water_supply_mgd","water_demand_mgd","energy_consumption_mu",
               "solar_capacity_mw","waste_generated_tpd","waste_processed_tpd",
               "ghg_emissions_mtco2","green_space_sqkm","population"]].sum()
    supply, demand = totals["water_supply_mgd"], totals["water_demand_mgd"]
    pop = totals["population"]
    return {
        "year": int(year),
        "water_gap_mgd": round(max(0, demand - supply), 1),
        "renewable_share_percent": round(min(100, totals["solar_capacity_mw"] * 0.4 * 365 / 1000 / (totals["energy_consumption_mu"] / 1000) * 100), 1),
        "waste_processing_rate": round((totals["waste_processed_tpd"] / totals["waste_generated_tpd"] * 100) if totals["waste_generated_tpd"] > 0 else 0, 1),
        "green_space_sqm_per_capita": round((totals["green_space_sqkm"] * 1e6) / pop if pop > 0 else 0, 2),
        "ghg_emissions_mtco2": round(totals["ghg_emissions_mtco2"], 1),
        "city_sustainability_score": round(d["sustainability_score"].mean(), 1),
        "zone_data": d.to_dict(orient="records"),
    }


@legacy.get("/data/zones")
def legacy_zones():
    return {"zones": ALL_ZONES}


@legacy.get("/data/full")
def legacy_full(zone: str = None, year: int = None):
    df = _load_legacy_df()
    if df.empty:
        return {"data": []}
    if zone:
        df = df[df["zone"] == zone]
    if year:
        df = df[df["year"] == year]
    return {"data": df.to_dict(orient="records")}


# ─── Lifespan: startup tasks ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init database
    await init_db()

    # Load CSV data
    try:
        from etl.ingestion import run_ingestion
        n = await run_ingestion()
        print(f"[Startup] Ingested {n} rows into DB")
    except Exception as e:
        print(f"[Startup] Ingestion skipped: {e}")

    # Train models if not already trained
    try:
        from routers.ml_router import get_df
        df = get_df()
        if not df.empty:
            from ml.composite_score import train_score_model, _load_model as load_score
            from ml.energy_model import train_energy_model, _load_model as load_energy
            from ml.waste_model import train_waste_model, _load_model as load_waste
            from ml.carbon_model import train_carbon_model, _load_model as load_carbon

            if load_score() is None:
                print("[Startup] Training composite score model...")
                train_score_model(df)
            if load_energy() is None:
                print("[Startup] Training energy model...")
                train_energy_model(df)
            if load_waste() is None:
                print("[Startup] Training waste model...")
                train_waste_model(df)
            if load_carbon()[0] is None:
                print("[Startup] Training carbon model...")
                train_carbon_model(df)
            print("[Startup] All ML models ready.")
    except Exception as e:
        print(f"[Startup] Model training skipped: {e}")

    # Start alert background task
    try:
        from alerts.alert_engine import alert_generator_loop
        asyncio.create_task(alert_generator_loop(interval=30))
        print("[Startup] Alert engine started.")
    except Exception as e:
        print(f"[Startup] Alert engine skipped: {e}")

    yield  # App running

    print("[Shutdown] InfraVision Sustainability API stopped.")


# ─── FastAPI App ─────────────────────────────────────────────────
app = FastAPI(
    title="InfraVision Sustainability Intelligence API",
    description=(
        "Production-grade AI Urban Sustainability System for Delhi.\n\n"
        "Includes: ML forecasting (Prophet/XGBoost/RF/Ridge), Digital Twin, "
        "LP Optimization, SHAP Explainability, Smart Alerts (SSE)."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(ml_router)
app.include_router(sim_router)
app.include_router(opt_router)
app.include_router(rec_router)
app.include_router(alerts_router)
app.include_router(ai_router)
app.include_router(legacy)   # old endpoints still work


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "InfraVision Sustainability Intelligence API v2",
        "status": "running",
        "endpoints": {
            "ml": "/api/ml/forecast/water|energy|waste|carbon, /api/ml/score, /api/ml/explain, /api/ml/performance",
            "simulation": "/api/simulation/graph, /api/simulation/compare, /api/simulation/stress",
            "optimization": "/api/optimization/solve, /api/optimization/pareto",
            "recommendation": "/api/recommendation/zone/{zone}, /api/recommendation/all",
            "alerts": "/api/alerts/stream (SSE), /api/alerts/history",
            "docs": "/docs",
        }
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/api/weather/delhi", tags=["Data"])
async def get_delhi_weather():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {"temperature_c": 32, "condition": "Clear", "source": "fallback"}
    async with httpx.AsyncClient() as client:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid={api_key}&units=metric"
            resp = await client.get(url, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            return {
                "temperature_c": data["main"]["temp"],
                "condition": data["weather"][0]["main"],
                "humidity": data["main"]["humidity"],
                "city": "Delhi",
                "source": "openweather",
            }
        except Exception:
            return {"temperature_c": 32, "condition": "Cloudy", "city": "Delhi", "source": "fallback"}
