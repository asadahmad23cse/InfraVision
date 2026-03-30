"""IoT Simulator: generates synthetic real-time sensor readings for water, energy, waste."""
import asyncio
import random
import math
from datetime import datetime
from config import ALL_ZONES


# Base values per zone for each sensor type
ZONE_BASE_VALUES = {
    "North":      {"water_flow": 320, "energy_load": 1800, "waste_fill": 62},
    "South":      {"water_flow": 290, "energy_load": 2100, "waste_fill": 55},
    "East":       {"water_flow": 340, "energy_load": 1650, "waste_fill": 78},
    "West":       {"water_flow": 310, "energy_load": 1950, "waste_fill": 60},
    "Central":    {"water_flow": 270, "energy_load": 2400, "waste_fill": 50},
    "North-East": {"water_flow": 360, "energy_load": 1500, "waste_fill": 72},
    "North-West": {"water_flow": 330, "energy_load": 1750, "waste_fill": 65},
    "South-West": {"water_flow": 295, "energy_load": 1870, "waste_fill": 58},
    "South-East": {"water_flow": 285, "energy_load": 2050, "waste_fill": 53},
}

SENSOR_UNITS = {
    "water_flow": "MGD",
    "energy_load": "MW",
    "waste_fill": "percent",
}


def _sine_noise(t: float, period: float = 24.0, amplitude: float = 0.1) -> float:
    """Add sinusoidal diurnal variation + Gaussian noise."""
    return math.sin(2 * math.pi * t / period) * amplitude + random.gauss(0, 0.03)


def generate_reading(zone: str, sensor_type: str, inject_anomaly: bool = False) -> dict:
    """Generate one synthetic sensor reading for given zone and sensor type."""
    base = ZONE_BASE_VALUES.get(zone, {}).get(sensor_type, 100)
    t = datetime.utcnow().hour + datetime.utcnow().minute / 60
    noise_factor = 1.0 + _sine_noise(t)

    value = base * noise_factor

    is_anomaly = False
    if inject_anomaly:
        # Simulate spike (e.g. pipe burst or energy overload)
        value *= random.uniform(1.8, 2.5)
        is_anomaly = True
    elif random.random() < 0.005:
        # 0.5% chance of natural anomaly
        value *= random.uniform(1.6, 2.2)
        is_anomaly = True

    # Clamp
    value = max(0.0, round(value, 3))

    return {
        "zone": zone,
        "sensor_type": sensor_type,
        "value": value,
        "unit": SENSOR_UNITS.get(sensor_type, "unit"),
        "is_anomaly": is_anomaly,
        "timestamp": datetime.utcnow().isoformat(),
    }


def generate_all_readings(inject_anomaly_zone: str | None = None) -> list[dict]:
    """Generate one reading per zone per sensor type."""
    readings = []
    for zone in ALL_ZONES:
        for sensor in ["water_flow", "energy_load", "waste_fill"]:
            inject = (zone == inject_anomaly_zone)
            readings.append(generate_reading(zone, sensor, inject_anomaly=inject))
    return readings


async def iot_stream_loop(callback, interval_seconds: int = 30):
    """Continuously generate readings and call callback(readings)."""
    while True:
        readings = generate_all_readings()
        await callback(readings)
        await asyncio.sleep(interval_seconds)
