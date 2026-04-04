"""
Carbon emission prediction using Ridge Regression (multivariate).
Features: energy_consumption, transport_mode_share, waste_landfill_pct, green_cover, population
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import CARBON_MODEL_PATH

_model = None
_scaler = None

FEATURE_COLS = [
    "energy_consumption_mu", "landfill_dependency_percent",
    "green_space_sqkm", "renewable_share_percent",
    "population_millions", "built_up_density_percent"
]

# Sector split weights (from Delhi GHG inventory)
SECTOR_WEIGHTS = {
    "energy": 0.58,
    "transport": 0.28,
    "waste": 0.09,
    "industrial": 0.05,
}


def train_carbon_model(full_df: pd.DataFrame):
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_percentage_error

    df = full_df.copy()
    df["population_millions"] = df["population"] / 1e6
    df = df.dropna(subset=FEATURE_COLS + ["ghg_emissions_mtco2"])

    X = df[FEATURE_COLS].values
    y = df["ghg_emissions_mtco2"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    mape = mean_absolute_percentage_error(y_test, model.predict(X_test))
    joblib.dump({"model": model, "scaler": scaler}, str(CARBON_MODEL_PATH))
    global _model, _scaler
    _model, _scaler = model, scaler
    return {"mape": round(mape * 100, 2), "features": FEATURE_COLS,
            "coefficients": dict(zip(FEATURE_COLS, model.coef_.tolist()))}


def _load_model():
    global _model, _scaler
    if _model is not None:
        return _model, _scaler
    if Path(CARBON_MODEL_PATH).exists():
        saved = joblib.load(str(CARBON_MODEL_PATH))
        _model, _scaler = saved["model"], saved["scaler"]
    return _model, _scaler


def forecast_carbon(zone: str, zone_df: pd.DataFrame, target_years: list[int]) -> list[dict]:
    model, scaler = _load_model()
    latest = zone_df[zone_df["zone"] == zone].sort_values("year").iloc[-1]

    base = {
        "energy_consumption_mu": float(latest.get("energy_consumption_mu", 3800)),
        "landfill_dependency_percent": float(latest.get("landfill_dependency_percent", 45)),
        "green_space_sqkm": float(latest.get("green_space_sqkm", 12)),
        "renewable_share_percent": float(latest.get("renewable_share_percent", 1.5)),
        "population": float(latest.get("population", 3e6)),
        "built_up_density_percent": float(latest.get("built_up_density_percent", 65)),
        "ghg_base": float(latest.get("ghg_emissions_mtco2", 5.5)),
    }

    results = []
    for year in target_years:
        t = year - 2022
        energy = base["energy_consumption_mu"] * (1.015 ** t)
        landfill = max(15, base["landfill_dependency_percent"] - t * 1.5)
        green = min(40, base["green_space_sqkm"] + t * 0.3)
        renewable = min(30, base["renewable_share_percent"] + t * 0.8)
        pop_m = (base["population"] * (1.018 ** t)) / 1e6
        built_up = min(92, base["built_up_density_percent"] + t * 0.4)

        if model and scaler:
            X = scaler.transform([[energy, landfill, green, renewable, pop_m, built_up]])
            pred = float(model.predict(X)[0])
        else:
            pred = base["ghg_base"] * (1.01 ** t) * (1 - renewable / 100 * 0.3)

        pred = max(1.0, pred)
        uncertainty = pred * 0.10
        # Sector breakdown
        breakdown = {
            k: round(pred * w, 3) for k, w in SECTOR_WEIGHTS.items()
        }
        results.append({
            "year": year,
            "ghg_forecast_mtco2": round(pred, 3),
            "lower": round(max(0, pred - uncertainty), 3),
            "upper": round(pred + uncertainty, 3),
            "sector_breakdown": breakdown,
            "net_zero_progress_pct": round((1 - pred / base["ghg_base"]) * 100, 1),
        })
    return results


def get_carbon_feature_importance() -> dict[str, float]:
    model, scaler = _load_model()
    if model is None:
        return {f: round(1/len(FEATURE_COLS), 3) for f in FEATURE_COLS}
    coefs = np.abs(model.coef_)
    total = float(coefs.sum()) or 1.0
    return {
        FEATURE_COLS[i]: float(round(float(coefs[i]) / total, 4))
        for i in range(len(FEATURE_COLS))
    }
