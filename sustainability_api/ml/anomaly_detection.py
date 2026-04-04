"""
Anomaly detection using Isolation Forest.
Detects water leakage spikes, energy load anomalies, and waste overflow from IoT streams.
"""
import numpy as np
import joblib
from pathlib import Path
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import ANOMALY_MODEL_PATH

_model: Optional[object] = None

SENSOR_THRESHOLDS = {
    "water_flow":  {"low": 50,  "high": 600},
    "energy_load": {"low": 500, "high": 4000},
    "waste_fill":  {"low": 5,   "high": 100},
}

ANOMALY_LABELS = {
    "water_flow":  "WATER_ANOMALY",
    "energy_load": "ENERGY_SPIKE",
    "waste_fill":  "WASTE_OVERFLOW",
}


def train_anomaly_model(readings: list[dict]):
    """
    Train Isolation Forest on historical IoT readings.
    readings: list of dicts with keys: water_flow, energy_load, waste_fill (one per zone).
    """
    from sklearn.ensemble import IsolationForest
    if not readings:
        return None

    X = np.array([[
        r.get("water_flow", 300),
        r.get("energy_load", 1800),
        r.get("waste_fill", 60),
    ] for r in readings])

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
    )
    model.fit(X)
    joblib.dump(model, str(ANOMALY_MODEL_PATH))
    global _model
    _model = model
    return model


def _load_model():
    global _model
    if _model is not None:
        return _model
    if Path(ANOMALY_MODEL_PATH).exists():
        _model = joblib.load(str(ANOMALY_MODEL_PATH))
    return _model


def detect_anomalies(readings: list[dict]) -> list[dict]:
    """
    Input: list of IoT readings per zone (water_flow, energy_load, waste_fill).
    Output: list of anomaly dicts for alert generation.
    """
    model = _load_model()
    anomalies = []

    for r in readings:
        zone = r.get("zone", "Unknown")
        sensor = r.get("sensor_type", "")
        value = float(r.get("value", 0))

        # Rule-based threshold check (always applied)
        thresh = SENSOR_THRESHOLDS.get(sensor, {})
        is_anomaly = value > thresh.get("high", 1e9) or value < thresh.get("low", -1)

        # ML-based: use Isolation Forest if available
        if model and not is_anomaly:
            # We need all 3 sensor values per zone; use value for the specific sensor
            X = np.array([[
                value if sensor == "water_flow" else 300,
                value if sensor == "energy_load" else 1800,
                value if sensor == "waste_fill" else 60,
            ]])
            pred = model.predict(X)[0]  # -1 = anomaly
            is_anomaly = (pred == -1)

        if is_anomaly:
            alert_type = ANOMALY_LABELS.get(sensor, "ANOMALY")
            severity = _severity(sensor, value, thresh)
            anomalies.append({
                "is_anomaly": True,
                "alert_type": alert_type,
                "zone": zone,
                "severity": severity,
                "message": f"{alert_type} detected in {zone}: {sensor}={value:.1f} {r.get('unit','')}",
                "metric_name": sensor,
                "metric_value": value,
                "threshold": thresh.get("high", 0),
            })
    return anomalies


def _severity(sensor: str, value: float, thresh: dict) -> int:
    high = thresh.get("high", 1)
    ratio = value / high if high > 0 else 1
    if ratio > 2.0:
        return 10
    elif ratio > 1.6:
        return 8
    elif ratio > 1.3:
        return 6
    elif value < thresh.get("low", 0) * 0.5:
        return 7
    return 4


def statistical_anomaly_check(series: list[float], window: int = 5) -> list[bool]:
    """Z-score based anomaly detection on a time series."""
    arr = np.array(series, dtype=float)
    flags = [False] * len(arr)
    for i in range(window, len(arr)):
        window_vals = arr[i - window:i]
        mean, std = window_vals.mean(), window_vals.std()
        if std > 0 and abs(arr[i] - mean) / std > 3.0:
            flags[i] = True
    return flags
