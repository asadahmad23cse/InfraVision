"""ML Router: forecast endpoints for water, energy, waste, carbon + composite score + explain."""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import ALL_ZONES

router = APIRouter(prefix="/api/ml", tags=["ML"])

# Shared data cache
_df: pd.DataFrame | None = None


def get_df() -> pd.DataFrame:
    global _df
    if _df is not None:
        return _df
    from pathlib import Path
    from config import DATA_DIR
    paths = [
        DATA_DIR / "expanded_sustainability_delhi.csv",
        Path(__file__).parent.parent.parent / "expanded_sustainable_resource_management_delhi.csv",
    ]
    for p in paths:
        if p.exists():
            _df = pd.read_csv(p)
            _df.columns = [c.strip().lower().replace(" ", "_") for c in _df.columns]
            return _df
    return pd.DataFrame()


class TrainRequest(BaseModel):
    models: list[str] = ["water", "energy", "waste", "carbon", "score"]


@router.post("/train")
def train_models(req: TrainRequest):
    """Trigger model training on the loaded dataset."""
    df = get_df()
    if df.empty:
        raise HTTPException(status_code=503, detail="No data loaded")
    results = {}
    if "water" in req.models:
        from ml.water_model import train_water_model
        results["water"] = train_water_model(df)
    if "energy" in req.models:
        from ml.energy_model import train_energy_model
        results["energy"] = train_energy_model(df)
    if "waste" in req.models:
        from ml.waste_model import train_waste_model
        results["waste"] = train_waste_model(df)
    if "carbon" in req.models:
        from ml.carbon_model import train_carbon_model
        results["carbon"] = train_carbon_model(df)
    if "score" in req.models:
        from ml.composite_score import train_score_model
        results["score"] = train_score_model(df)
    return {"status": "trained", "results": results}


@router.get("/forecast/water")
def forecast_water(
    zone: str = Query(..., description="Delhi zone name"),
    start_year: int = Query(2025),
    end_year: int = Query(2030),
    temperature: float = Query(30.0),
    population_millions: float = Query(3.5),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail=f"Zone must be one of {ALL_ZONES}")
    from ml.water_model import forecast_water as fw
    years = list(range(start_year, end_year + 1))
    predictions = fw(zone, years, temperature, population_millions)
    importance = {}
    try:
        from ml.water_model import get_water_feature_importance
        importance = get_water_feature_importance(zone)
    except Exception:
        pass
    return {"zone": zone, "model": "Prophet", "predictions": predictions, "feature_importance": importance}


@router.get("/forecast/energy")
def forecast_energy(
    zone: str = Query(...),
    start_year: int = Query(2025),
    end_year: int = Query(2030),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Invalid zone")
    from ml.energy_model import forecast_energy as fe, get_energy_feature_importance
    df = get_df()
    years = list(range(start_year, end_year + 1))
    predictions = fe(zone, df, years)
    return {"zone": zone, "model": "XGBoost", "predictions": predictions,
            "feature_importance": get_energy_feature_importance()}


@router.get("/forecast/waste")
def forecast_waste(
    zone: str = Query(...),
    start_year: int = Query(2025),
    end_year: int = Query(2030),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Invalid zone")
    from ml.waste_model import forecast_waste as fwaste, get_waste_feature_importance
    df = get_df()
    years = list(range(start_year, end_year + 1))
    predictions = fwaste(zone, df, years)
    return {"zone": zone, "model": "RandomForest", "predictions": predictions,
            "feature_importance": get_waste_feature_importance()}


@router.get("/forecast/carbon")
def forecast_carbon(
    zone: str = Query(...),
    start_year: int = Query(2025),
    end_year: int = Query(2030),
):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Invalid zone")
    from ml.carbon_model import forecast_carbon as fc, get_carbon_feature_importance
    df = get_df()
    years = list(range(start_year, end_year + 1))
    predictions = fc(zone, df, years)
    return {"zone": zone, "model": "Ridge", "predictions": predictions,
            "feature_importance": get_carbon_feature_importance()}


@router.get("/score")
def get_score(zone: str = Query(...), year: int = Query(2022)):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Invalid zone")
    df = get_df()
    if df.empty:
        raise HTTPException(status_code=503, detail="No data")
    row = df[(df["zone"] == zone) & (df["year"] == year)]
    if row.empty:
        row = df[df["zone"] == zone].sort_values("year").iloc[[-1]]
    from ml.composite_score import predict_score
    result = predict_score(row.iloc[0].to_dict())
    return {"zone": zone, "year": year, "model": "GradientBoosting", **result}


@router.get("/explain")
def explain(zone: str = Query(...), year: int = Query(2022)):
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail="Invalid zone")
    df = get_df()
    if df.empty:
        raise HTTPException(status_code=503, detail="No data")
    row = df[(df["zone"] == zone) & (df["year"] == year)]
    if row.empty:
        row = df[df["zone"] == zone].sort_values("year").iloc[[-1]]
    from ml.explainability import explain_score_prediction, format_shap_for_frontend
    result = explain_score_prediction(row.iloc[0].to_dict())
    return {
        "zone": zone, "year": year,
        **result,
        "waterfall": format_shap_for_frontend(result)
    }


@router.get("/feature-importance")
def get_feature_importance(model: str = Query("score")):
    try:
        if model == "score":
            from ml.composite_score import get_score_feature_importance
            return {"model": model, "importance": get_score_feature_importance()}
        elif model == "energy":
            from ml.energy_model import get_energy_feature_importance
            return {"model": model, "importance": get_energy_feature_importance()}
        elif model == "waste":
            from ml.waste_model import get_waste_feature_importance
            return {"model": model, "importance": get_waste_feature_importance()}
        elif model == "carbon":
            from ml.carbon_model import get_carbon_feature_importance
            return {"model": model, "importance": get_carbon_feature_importance()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=400, detail="Unknown model")
