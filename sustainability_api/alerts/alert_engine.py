"""
Smart Alerts Engine.
Monitors IoT readings and zone metrics; generates, stores, and streams alerts.
Uses SSE (Server-Sent Events) for real-time frontend delivery.
"""
import asyncio
import json
from datetime import datetime
import time
from typing import AsyncIterator
from pathlib import Path
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from ml.anomaly_detection import detect_anomalies
from etl.iot_simulator import generate_all_readings
from config import DATA_DIR

# In-memory alert queue (use DB in production at scale)
_alert_queue: asyncio.Queue = asyncio.Queue(maxsize=200)
_alert_history: list[dict] = []
MAX_HISTORY = 100

# Threshold checks cache/cooldown
_zone_metric_cache: tuple[float, list[dict]] = (0.0, [])
_threshold_last_emitted: dict[tuple[str, str], float] = {}
THRESHOLD_CACHE_TTL_SECONDS = 60
THRESHOLD_ALERT_COOLDOWN_SECONDS = 300


def _load_latest_zone_metrics() -> list[dict]:
    """
    Load latest zone rows from sustainability CSV with short cache.
    """
    global _zone_metric_cache
    now = time.time()
    ts, cached = _zone_metric_cache
    if cached and (now - ts) < THRESHOLD_CACHE_TTL_SECONDS:
        return cached

    paths = [
        DATA_DIR / "expanded_sustainability_delhi.csv",
        Path(__file__).parent.parent.parent / "expanded_sustainable_resource_management_delhi.csv",
    ]
    rows: list[dict] = []
    for p in paths:
        if p.exists():
            df = pd.read_csv(p)
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            if "zone" not in df.columns or "year" not in df.columns:
                continue
            for zone, zdf in df.groupby("zone"):
                latest = zdf.sort_values("year").iloc[-1].to_dict()
                rows.append(latest)
            break

    _zone_metric_cache = (now, rows)
    return rows


def _maybe_emit_threshold_alert(alert_type: str, zone: str) -> bool:
    """
    Cooldown gate to prevent flooding duplicate threshold alerts.
    """
    key = (alert_type, zone)
    now = time.time()
    last = _threshold_last_emitted.get(key, 0.0)
    if now - last < THRESHOLD_ALERT_COOLDOWN_SECONDS:
        return False
    _threshold_last_emitted[key] = now
    return True


def _threshold_alerts_from_zone_metrics() -> list[dict]:
    """
    Generate threshold-based sustainability alerts from latest zone metrics.
    """
    alerts: list[dict] = []
    for r in _load_latest_zone_metrics():
        zone = str(r.get("zone", "Unknown"))
        supply = float(r.get("water_supply_mgd", 0) or 0)
        demand = float(r.get("water_demand_mgd", 0) or 0)
        landfill = float(r.get("landfill_dependency_percent", 0) or 0)
        wgen = float(r.get("waste_generated_tpd", 0) or 0)
        wproc = float(r.get("waste_processed_tpd", 0) or 0)
        built = float(r.get("built_up_density_percent", 0) or 0)
        tree = float(r.get("tree_cover_percent", 0) or 0)

        water_stress = 0.0 if demand <= 0 else max(0.0, min(1.0, (demand - supply) / demand))
        waste_overflow = 0.0 if wgen <= 0 else max(0.0, min(1.0, ((wgen - wproc) / wgen) * (landfill / 100 + 0.1)))
        heat_risk = max(0.0, min(1.0, (built / 100) * 0.7 + (1 - tree / 100) * 0.3))

        if water_stress > 0.8 and _maybe_emit_threshold_alert("WATER_STRESS_CRITICAL", zone):
            alerts.append({
                "alert_type": "WATER_STRESS_CRITICAL",
                "zone": zone,
                "severity": 9,
                "message": f"Critical water stress in {zone}: index={water_stress:.2f}",
                "metric_name": "water_stress_index",
                "metric_value": round(water_stress, 4),
                "threshold": 0.8,
            })

        if waste_overflow > 0.75 and _maybe_emit_threshold_alert("WASTE_OVERFLOW_CRITICAL", zone):
            alerts.append({
                "alert_type": "WASTE_OVERFLOW_CRITICAL",
                "zone": zone,
                "severity": 8,
                "message": f"Critical waste overflow risk in {zone}: index={waste_overflow:.2f}",
                "metric_name": "waste_overflow_risk",
                "metric_value": round(waste_overflow, 4),
                "threshold": 0.75,
            })

        if heat_risk > 0.85 and _maybe_emit_threshold_alert("HEAT_ISLAND_CRITICAL", zone):
            alerts.append({
                "alert_type": "HEAT_ISLAND_CRITICAL",
                "zone": zone,
                "severity": 7,
                "message": f"Heat island risk high in {zone}: score={heat_risk:.2f}",
                "metric_name": "heat_island_proxy",
                "metric_value": round(heat_risk, 4),
                "threshold": 0.85,
            })
    return alerts


async def process_iot_batch(readings: list[dict]):
    """Detect anomalies in an IoT batch and push alerts to queue."""
    anomalies = detect_anomalies(readings)
    threshold_alerts = _threshold_alerts_from_zone_metrics()
    for anomaly in anomalies + threshold_alerts:
        alert = {
            **anomaly,
            "id": f"ALT-{int(datetime.utcnow().timestamp()*1000)}",
            "timestamp": datetime.utcnow().isoformat(),
            "is_resolved": False,
        }
        _alert_history.insert(0, alert)
        if len(_alert_history) > MAX_HISTORY:
            _alert_history.pop()
        try:
            _alert_queue.put_nowait(alert)
        except asyncio.QueueFull:
            _alert_queue.get_nowait()  # drop oldest
            _alert_queue.put_nowait(alert)


async def alert_generator_loop(interval: int = 30):
    """Background task: generates IoT readings and processes alerts every `interval` seconds."""
    while True:
        try:
            readings = generate_all_readings()
            await process_iot_batch(readings)
        except Exception as e:
            print(f"[Alert Engine] Error: {e}")
        await asyncio.sleep(interval)


async def sse_alert_stream() -> AsyncIterator[str]:
    """
    Server-Sent Events stream for frontend consumption.
    Yields alert JSON as 'data: {...}\n\n'.
    """
    # Send history first
    for alert in _alert_history[:10]:
        yield f"data: {json.dumps(alert)}\n\n"

    # Stream new alerts
    while True:
        try:
            alert = await asyncio.wait_for(_alert_queue.get(), timeout=25.0)
            yield f"data: {json.dumps(alert)}\n\n"
        except asyncio.TimeoutError:
            yield "data: {\"type\": \"heartbeat\"}\n\n"


def get_alert_history(limit: int = 50) -> list[dict]:
    return _alert_history[:limit]


def get_active_alerts() -> list[dict]:
    return [a for a in _alert_history if not a.get("is_resolved")]


def resolve_alert(alert_id: str) -> bool:
    for a in _alert_history:
        if a.get("id") == alert_id:
            a["is_resolved"] = True
            return True
    return False


def inject_test_alert(zone: str = "North-East", alert_type: str = "WATER_ANOMALY") -> dict:
    """Inject a test alert for demo purposes."""
    alert = {
        "id": f"TEST-{int(datetime.utcnow().timestamp()*1000)}",
        "alert_type": alert_type,
        "zone": zone,
        "severity": 8,
        "message": f"[TEST] {alert_type} detected in {zone}",
        "metric_name": "water_flow",
        "metric_value": 750.0,
        "threshold": 600.0,
        "timestamp": datetime.utcnow().isoformat(),
        "is_resolved": False,
    }
    _alert_history.insert(0, alert)
    try:
        _alert_queue.put_nowait(alert)
    except Exception:
        pass
    return alert
