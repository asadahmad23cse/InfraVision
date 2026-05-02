"""
Energy consumption forecasting using XGBoost regressor.
Features: month, population, solar_capacity, temperature, peak_demand_lag
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import ENERGY_MODEL_PATH, ALL_ZONES

_model = None
_model_zone = {}


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["year_norm"] = (df["year"] - 2015) / 15.0
    df["pop_millions"] = df["population"] / 1e6
    df["solar_pct"] = df["solar_capacity_mw"] / df["energy_consumption_mu"].replace(0, 1) * 100
    df["temp"] = df.get("temperature_celsius", pd.Series([28.0] * len(df)))
    df["renewable_pct"] = df["renewable_share_percent"].fillna(1.5)
    df["lag_demand"] = df.groupby("zone")["energy_consumption_mu"].shift(1).bfill()
    return df


FEATURE_COLS = ["year_norm", "pop_millions", "solar_pct", "temp", "renewable_pct", "lag_demand"]


def train_energy_model(full_df: pd.DataFrame):
    """Train XGBoost on zone-year data. Persists model."""
    try:
        import xgboost as xgb
    except ImportError:
        raise ImportError("Install xgboost: pip install xgboost")
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_percentage_error

    df = _build_features(full_df)
    df = df.dropna(subset=FEATURE_COLS + ["energy_consumption_mu"])

    X = df[FEATURE_COLS].values
    y = df["energy_consumption_mu"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
    mape = mean_absolute_percentage_error(y_test, model.predict(X_test))
    model.save_model(str(ENERGY_MODEL_PATH))
    global _model
    _model = model
    return {"mape": round(mape * 100, 2), "features": FEATURE_COLS}


def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        import xgboost as xgb
        m = xgb.XGBRegressor()
        m.load_model(str(ENERGY_MODEL_PATH))
        _model = m
        return m
    except Exception:
        return None


def forecast_energy(zone: str, zone_df: pd.DataFrame, target_years: list[int]) -> list[dict]:
    """Forecast energy consumption per year for a zone."""
    model = _load_model()
    results = []

    latest = zone_df[zone_df["zone"] == zone].sort_values("year").iloc[-1]
    base_pop = float(latest.get("population", 3e6))
    base_solar = float(latest.get("solar_capacity_mw", 200))
    base_energy = float(latest.get("energy_consumption_mu", 34000))
    base_renewable = float(latest.get("renewable_share_percent", 1.5))

    for year in target_years:
        pop_m = (base_pop * (1.018 ** (year - 2022))) / 1e6
        solar = base_solar * (1.12 ** max(0, (year - 2022)))  # 12% solar growth
        solar_pct = solar / base_energy * 100
        temp = 28.0 + (year - 2022) * 0.04
        renewable = min(30, base_renewable + (year - 2022) * 0.8)
        year_norm = (year - 2015) / 15.0
        lag_demand = base_energy * (1.015 ** (year - 2022 - 1))

        if model:
            X = np.array([[year_norm, pop_m, solar_pct, temp, renewable, lag_demand]])
            pred = float(model.predict(X)[0])
        else:
            pred = base_energy * (1.015 ** (year - 2022))
        preds.append(pred)

    return [{
        "year": year,
        "energy_forecast_mu": round(pred, 1),
        "lower": round(pred * 0.92, 1),
        "upper": round(pred * 1.08, 1),
        "solar_capacity_mw": round(base_solar * (1.12 ** max(0, (year - 2022))), 1),
        "renewable_share_pct": round(min(30, base_renewable + (year - 2022) * 0.8), 2),
                                     28.0 + (y - 2022) * 0.04, 
                                     min(30, base_renewable + (y - 2022) * 0.8), 
                                     base_energy * (1.015 ** (y - 2022 - 1))]]))[0]) if model 
         else base_energy * (1.015 ** (y - 2022)) for y in target_years])]


def get_energy_feature_importance() -> dict[str, float]:
    """Returns XGBoost feature importances."""
    model = _load_model()
    if model is None:
        return {f: round(1/len(FEATURE_COLS), 3) for f in FEATURE_COLS}
    scores = model.feature_importances_
    total = float(sum(scores)) or 1.0
    return {
        FEATURE_COLS[i]: float(round(float(scores[i]) / total, 4))
        for i in range(len(FEATURE_COLS))
    }
