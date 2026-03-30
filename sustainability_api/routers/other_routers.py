"""Optimization, Recommendation, and Alerts Routers."""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import ALL_ZONES

# ─── OPTIMIZATION ROUTER ────────────────────────────────────────
opt_router = APIRouter(prefix="/api/optimization", tags=["Optimization"])


class OptimizationRequest(BaseModel):
    budget_cr: float = Field(1500, ge=100, le=10000, description="Total budget in ₹ Crore")
    target_ghg_reduction: float = Field(5.0, ge=0, le=20)
    min_score_lift: float = Field(10.0, ge=0, le=40)


@opt_router.post("/solve")
def solve_optimization(req: OptimizationRequest):
    """
    Run LP optimization to find optimal sustainability policy mix.
    Returns decision variables (0–1), cost, GHG reduction, score lift, ROI.
    """
    from optimization.lp_solver import optimize_policy
    return optimize_policy(
        budget_cr=req.budget_cr,
        target_ghg_reduction=req.target_ghg_reduction,
        min_score_lift=req.min_score_lift,
    )


@opt_router.get("/pareto")
def pareto_frontier(budget_cr: float = Query(1500), steps: int = Query(6)):
    """
    Compute trade-off curve: score lift vs GHG reduction at different budget allocations.
    """
    from optimization.lp_solver import optimize_policy
    points = []
    for i in range(steps):
        b = budget_cr * (i + 1) / steps
        try:
            r = optimize_policy(budget_cr=b, target_ghg_reduction=0, min_score_lift=0)
            pts = r["projected_impact"]
            points.append({
                "budget_cr": round(b, 0),
                "score_lift": pts["score_lift_points"],
                "ghg_reduction": pts["ghg_reduction_mtco2"],
                "cost": pts["total_cost_cr"],
            })
        except Exception:
            continue
    return {"pareto_points": points}


# ─── RECOMMENDATION ROUTER ────────────────────────────────────────
rec_router = APIRouter(prefix="/api/recommendation", tags=["Recommendation"])


def _get_latest_row(zone: str) -> dict:
    import pandas as pd
    from pathlib import Path
    from config import DATA_DIR
    paths = [
        DATA_DIR / "expanded_sustainability_delhi.csv",
        Path(__file__).parent.parent.parent / "expanded_sustainable_resource_management_delhi.csv",
    ]
    for p in paths:
        if p.exists():
            df = pd.read_csv(p)
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            zdf = df[df["zone"] == zone]
            if not zdf.empty:
                return zdf.sort_values("year").iloc[-1].to_dict()
    return {}


@rec_router.get("/zone/{zone}")
def recommend_zone(zone: str):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail=f"Zone must be one of {ALL_ZONES}")
    from recommendation.rule_engine import get_zone_recommendations
    row = _get_latest_row(zone)
    if not row:
        raise HTTPException(status_code=503, detail="No data")
    return get_zone_recommendations(zone, row)


@rec_router.get("/all")
def recommend_all():
    """Get recommendations for all 9 zones, sorted by worst score first."""
    import pandas as pd
    from pathlib import Path
    from config import DATA_DIR
    from recommendation.rule_engine import get_all_zones_summary

    paths = [
        DATA_DIR / "expanded_sustainability_delhi.csv",
        Path(__file__).parent.parent.parent / "expanded_sustainable_resource_management_delhi.csv",
    ]
    for p in paths:
        if p.exists():
            df = pd.read_csv(p)
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            rows = []
            for zone in ALL_ZONES:
                zdf = df[df["zone"] == zone]
                if not zdf.empty:
                    rows.append(zdf.sort_values("year").iloc[-1].to_dict())
            return {"zones": get_all_zones_summary(rows)}
    raise HTTPException(status_code=503, detail="No data")


@rec_router.get("/climate-risk")
def climate_risk(zone: str = Query(...)):
    """Climate risk assessment for a zone (heat island, flood, water scarcity)."""
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Invalid zone")
    row = _get_latest_row(zone)
    if not row:
        raise HTTPException(status_code=503, detail="No data")
    from etl.feature_engineering import engineer_features
    feats = engineer_features(row)
    heat = feats["heat_island_score"]
    water_stress = feats["water_stress_index"]
    green = feats["green_sqm_per_capita"]
    risks = []
    if heat > 7:     risks.append({"type": "Heat Island", "level": "Critical", "score": heat})
    elif heat > 5:   risks.append({"type": "Heat Island", "level": "High",     "score": heat})
    if water_stress > 0.3: risks.append({"type": "Water Scarcity", "level": "Critical", "score": water_stress * 10})
    if green < 3:    risks.append({"type": "Green Deficit", "level": "High",   "score": (3 - green) / 3 * 10})
    overall = "Critical" if any(r["level"] == "Critical" for r in risks) else \
              "High" if risks else "Moderate"
    return {"zone": zone, "overall_risk": overall, "risk_factors": risks, "derived_indicators": feats}


# ─── ALERTS ROUTER ────────────────────────────────────────────────
alerts_router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@alerts_router.get("/history")
def get_history(limit: int = Query(50, le=200)):
    from alerts.alert_engine import get_alert_history
    return {"alerts": get_alert_history(limit)}


@alerts_router.get("/active")
def get_active():
    from alerts.alert_engine import get_active_alerts
    return {"alerts": get_active_alerts()}


@alerts_router.post("/resolve/{alert_id}")
def resolve(alert_id: str):
    from alerts.alert_engine import resolve_alert
    ok = resolve_alert(alert_id)
    return {"resolved": ok, "alert_id": alert_id}


@alerts_router.post("/test")
def inject_test(zone: str = Query("North-East"), alert_type: str = Query("WATER_ANOMALY")):
    from alerts.alert_engine import inject_test_alert
    return inject_test_alert(zone, alert_type)


@alerts_router.get("/stream")
async def stream_alerts():
    """SSE endpoint for real-time alert streaming."""
    from sse_starlette.sse import EventSourceResponse
    from alerts.alert_engine import sse_alert_stream
    return EventSourceResponse(sse_alert_stream())
