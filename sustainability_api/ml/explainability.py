"""
Explainability module using SHAP.
Provides per-prediction feature attribution for all ML models.
"""
import numpy as np
import pandas as pd
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from etl.feature_engineering import FEATURE_NAMES, build_feature_vector

_score_explainer = None


def init_score_shap_explainer(model=None) -> bool:
    """
    Initialize and cache SHAP explainer for the composite score model.
    Returns True if SHAP explainer is ready, else False.
    """
    global _score_explainer
    if _score_explainer is not None:
        return True
    if model is None:
        from ml.composite_score import _load_model
        model = _load_model()
    if model is None:
        return False
    try:
        import shap
        _score_explainer = shap.TreeExplainer(model)
        return True
    except Exception:
        _score_explainer = None
        return False


def explain_score_prediction(row: dict, model=None) -> dict:
    """
    Returns SHAP values for a composite score prediction.
    Falls back to feature-importance-weighted manual attribution if SHAP unavailable.
    """
    if model is None:
        from ml.composite_score import _load_model
        model = _load_model()

    fv = build_feature_vector(row)
    X = np.array([fv])

    try:
        explainer = _score_explainer if _score_explainer is not None else None
        if explainer is None:
            if not init_score_shap_explainer(model):
                raise RuntimeError("SHAP explainer initialization failed")
            explainer = _score_explainer

        shap_vals = explainer.shap_values(X)[0]
        attribution = {
            FEATURE_NAMES[i]: round(float(shap_vals[i]), 4)
            for i in range(len(FEATURE_NAMES))
        }
        base_value = float(explainer.expected_value)
        prediction = float(model.predict(X)[0])
    except Exception:
        # Manual fallback: proportion of each feature relative to prediction
        if model:
            importances = model.feature_importances_
            prediction = float(model.predict(X)[0])
            base_value = 50.0
            delta = prediction - base_value
            attribution = {
                FEATURE_NAMES[i]: round(float(importances[i]) * delta, 4)
                for i in range(len(FEATURE_NAMES))
            }
        else:
            attribution = {f: 0.0 for f in FEATURE_NAMES}
            prediction, base_value = 55.0, 50.0

    # Sort by absolute value descending
    sorted_attrs = dict(sorted(attribution.items(), key=lambda x: abs(x[1]), reverse=True))

    return {
        "prediction": round(prediction, 2),
        "base_value": round(base_value, 2),
        "shap_values": sorted_attrs,
        "top_positive_drivers": [
            {"feature": k, "shap": v, "direction": "positive"}
            for k, v in sorted_attrs.items() if v > 0
        ][:4],
        "top_negative_drivers": [
            {"feature": k, "shap": v, "direction": "negative"}
            for k, v in sorted_attrs.items() if v < 0
        ][:4],
        "feature_values": dict(zip(FEATURE_NAMES, [round(float(x), 4) for x in fv])),
    }


def explain_energy_prediction(X_row: np.ndarray, feature_names: list[str], model=None) -> dict:
    """SHAP explanation for XGBoost energy model."""
    if model is None:
        from ml.energy_model import _load_model
        model = _load_model()

    if model is None:
        return {"shap_values": {f: 0.0 for f in feature_names}, "prediction": 0}

    X = X_row.reshape(1, -1)
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X)[0]
        return {
            "prediction": round(float(model.predict(X)[0]), 2),
            "base_value": round(float(explainer.expected_value), 2),
            "shap_values": {
                feature_names[i]: round(float(shap_vals[i]), 4) for i in range(len(feature_names))
            }
        }
    except Exception:
        pred = float(model.predict(X)[0])
        importances = model.feature_importances_
        return {
            "prediction": round(pred, 2),
            "base_value": round(pred * 0.9, 2),
            "shap_values": {
                feature_names[i]: round(float(importances[i]) * pred * 0.1, 4)
                for i in range(len(feature_names))
            }
        }


def format_shap_for_frontend(shap_result: dict) -> list[dict]:
    """Convert SHAP dict to list format for waterfall chart rendering."""
    return [
        {
            "feature": k,
            "shap_value": v,
            "direction": "positive" if v >= 0 else "negative",
            "abs_value": abs(v)
        }
        for k, v in shap_result.get("shap_values", {}).items()
    ]
