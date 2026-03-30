"""
Smart Alerts Engine.
Monitors IoT readings and zone metrics; generates, stores, and streams alerts.
Uses SSE (Server-Sent Events) for real-time frontend delivery.
"""
import asyncio
import json
from datetime import datetime
from typing import AsyncIterator
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from ml.anomaly_detection import detect_anomalies
from etl.iot_simulator import generate_all_readings

# In-memory alert queue (use DB in production at scale)
_alert_queue: asyncio.Queue = asyncio.Queue(maxsize=200)
_alert_history: list[dict] = []
MAX_HISTORY = 100


async def process_iot_batch(readings: list[dict]):
    """Detect anomalies in an IoT batch and push alerts to queue."""
    anomalies = detect_anomalies(readings)
    for anomaly in anomalies:
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
