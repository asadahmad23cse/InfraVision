"""
ML-based composite sustainability score (0–100) using Gradient Boosted Regression.
Replaces the static weighted formula with a learned model trained on labeled zone data.
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import SCORE_MODEL_PATH
from etl.feature_engineering import FEATURE_NAMES, build_feature_vector

_model = None

# Static formula as training signal when labeled score is unavailable
def _static_score(row: dict) -> float:
    supply = row.get("water_supply_mgd", 0)
    demand = row.get("water_demand_mgd", 1) or 1
    water = min(100, supply / demand * 100)

    renewable = row.get("renewable_share_percent", 0)
    energy = min(100, renewable * 33.3)

    wg = row.get("waste_generated_tpd", 1) or 1
    wp = row.get("waste_processed_tpd", 0)
    waste = min(100, wp / wg * 100)

    pop = row.get("population", 1) or 1
    green_sqkm = row.get("green_space_sqkm", 0)
    sqm_per_cap = (green_sqkm * 1e6) / pop
    green = min(100, (sqm_per_cap / 9) * 50 + min(50, row.get("tree_cover_percent", 0) * 2))

    ghg = row.get("ghg_emissions_mtco2", 0)
    emission = max(0, min(100, 100 - ((ghg / 55) - 1) * 50))

    return round(water * 0.25 + energy * 0.20 + waste * 0.20 + green * 0.20 + emission * 0.15, 2)


def train_score_model(full_df: pd.DataFrame):
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.model_selection import cross_val_score
    from sklearn.metrics import mean_absolute_error

    df = full_df.copy()
    # Generate target: use labeled score if available, else static formula
    if "sustainability_score" in df.columns and df["sustainability_score"].notna().sum() > 10:
        y_col = "sustainability_score"
    else:
        df["_score"] = df.apply(lambda r: _static_score(r.to_dict()), axis=1)
        y_col = "_score"

    X_list, y_list = [], []
    for _, row in df.iterrows():
        try:
            fv = build_feature_vector(row.to_dict())
            X_list.append(fv)
            y_list.append(float(row[y_col]))
        except Exception:
            continue

    X = np.array(X_list)
    y = np.array(y_list)

    model = GradientBoostingRegressor(
        n_estimators=200, max_depth=4, learning_rate=0.05,
        subsample=0.8, random_state=42
    )
    cv_mae = -cross_val_score(model, X, y, cv=3, scoring="neg_mean_absolute_error").mean()
    model.fit(X, y)
    joblib.dump(model, str(SCORE_MODEL_PATH))
    global _model
    _model = model
    return {"cv_mae": round(cv_mae, 3), "features": FEATURE_NAMES}


def _load_model():
    global _model
    if _model is not None:
        return _model
    if Path(SCORE_MODEL_PATH).exists():
        _model = joblib.load(str(SCORE_MODEL_PATH))
    return _model


def predict_score(row: dict) -> dict:
    """Predict sustainability score for a single zone row dict."""
    model = _load_model()
    fv = build_feature_vector(row)
    if model:
        score = float(model.predict([fv])[0])
        score = max(0.0, min(100.0, score))
        confidence = 3.5  # ± points
    else:
        score = _static_score(row)
        confidence = 5.0
    return {"score": round(score, 2), "confidence_interval": round(confidence, 1)}


def batch_score(zone_df: pd.DataFrame) -> list[dict]:
    """Score all rows in a zone dataframe."""
    results = []
    for _, row in zone_df.iterrows():
        s = predict_score(row.to_dict())
        results.append({
            "zone": row.get("zone"), "year": row.get("year"),
            **s
        })
    return results


def get_score_feature_importance() -> dict[str, float]:
    model = _load_model()
    if model is None:
        return {f: round(1/len(FEATURE_NAMES), 4) for f in FEATURE_NAMES}
    scores = model.feature_importances_
    total = float(scores.sum()) or 1.0
    return {
        FEATURE_NAMES[i]: float(round(float(scores[i]) / total, 4))
        for i in range(len(FEATURE_NAMES))
    }
