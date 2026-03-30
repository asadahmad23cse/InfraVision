"""
Waste generation prediction using Random Forest Regressor.
Features: population_density, urbanization index, built-up %, year
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import WASTE_MODEL_PATH, ALL_ZONES

_model = None
FEATURE_COLS = ["population_density", "built_up_density_percent", "year_norm", "waste_processed_lag"]
ZONE_AREA_SQKM = {
    "North": 60, "South": 80, "East": 55, "West": 70, "Central": 35,
    "North-East": 65, "North-West": 75, "South-West": 68, "South-East": 72,
}


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["area"] = df["zone"].map(ZONE_AREA_SQKM).fillna(65)
    df["population_density"] = df["population"] / df["area"]
    df["year_norm"] = (df["year"] - 2015) / 15.0
    df["waste_processed_lag"] = df.groupby("zone")["waste_processed_tpd"].shift(1).fillna(method="bfill")
    df["built_up_density_percent"] = df.get("built_up_density_percent", pd.Series([65.0] * len(df)))
    return df


def train_waste_model(full_df: pd.DataFrame):
    """Train Random Forest on waste generation."""
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_percentage_error

    df = _build_features(full_df).dropna(subset=FEATURE_COLS + ["waste_generated_tpd"])
    X = df[FEATURE_COLS].values
    y = df["waste_generated_tpd"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(
        n_estimators=150, max_depth=8, min_samples_split=3,
        n_jobs=-1, random_state=42
    )
    model.fit(X_train, y_train)
    mape = mean_absolute_percentage_error(y_test, model.predict(X_test))
    joblib.dump(model, str(WASTE_MODEL_PATH))
    global _model
    _model = model
    return {"mape": round(mape * 100, 2), "features": FEATURE_COLS}


def _load_model():
    global _model
    if _model is not None:
        return _model
    if Path(WASTE_MODEL_PATH).exists():
        _model = joblib.load(str(WASTE_MODEL_PATH))
    return _model


def forecast_waste(zone: str, zone_df: pd.DataFrame, target_years: list[int]) -> list[dict]:
    model = _load_model()
    latest = zone_df[zone_df["zone"] == zone].sort_values("year").iloc[-1]
    base_pop = float(latest.get("population", 3e6))
    base_waste_proc = float(latest.get("waste_processed_tpd", 6000))
    base_waste_gen = float(latest.get("waste_generated_tpd", 10000))
    base_built_up = float(latest.get("built_up_density_percent", 65))
    area = ZONE_AREA_SQKM.get(zone, 65)

    results = []
    for year in target_years:
        pop = base_pop * (1.018 ** (year - 2022))
        pop_density = pop / area
        year_norm = (year - 2015) / 15.0
        built_up = min(95, base_built_up + (year - 2022) * 0.5)
        waste_proc_lag = base_waste_proc * (1.02 ** (year - 2023))

        if model:
            X = np.array([[pop_density, built_up, year_norm, waste_proc_lag]])
            pred = float(model.predict(X)[0])
        else:
            pred = base_waste_gen * (1.02 ** (year - 2022))

        uncertainty = pred * 0.07
        # Circular economy improvement over years
        ce_improvement = min(0.3, (year - 2022) * 0.015)
        processed = min(pred, base_waste_proc * (1.015 ** (year - 2022)) * (1 + ce_improvement))
        landfill_pct = max(10, (pred - processed) / pred * 100)

        results.append({
            "year": year,
            "waste_generation_tpd": round(pred, 1),
            "lower": round(pred - uncertainty, 1),
            "upper": round(pred + uncertainty, 1),
            "waste_processed_tpd": round(processed, 1),
            "landfill_dependency_percent": round(landfill_pct, 1),
            "ce_index": round(processed / pred * 100, 1),
        })
    return results


def get_waste_feature_importance() -> dict[str, float]:
    model = _load_model()
    if model is None:
        return {f: round(1/len(FEATURE_COLS), 3) for f in FEATURE_COLS}
    scores = model.feature_importances_
    total = sum(scores)
    return {FEATURE_COLS[i]: round(float(scores[i]) / total, 4) for i in range(len(FEATURE_COLS))}
