"""
Configuration for the InfraVision Sustainability API.
All settings read from .env or environment variables.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR.parent / "data"
MODELS_DIR = BASE_DIR / "trained_models"
MODELS_DIR.mkdir(exist_ok=True)

# Database
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    f"sqlite+aiosqlite:///{BASE_DIR / 'sustainability.db'}"
)

# External APIs
OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# Delhi zone coordinates (lat, lon) for weather API calls
ZONE_COORDINATES: dict[str, tuple[float, float]] = {
    "North":      (28.7041, 77.1025),
    "South":      (28.5355, 77.2090),
    "East":       (28.6279, 77.2957),
    "West":       (28.6516, 77.0628),
    "Central":    (28.6562, 77.2410),
    "North-East": (28.7307, 77.2881),
    "North-West": (28.7219, 77.0870),
    "South-West": (28.5706, 77.0632),
    "South-East": (28.5162, 77.2773),
}

ALL_ZONES = list(ZONE_COORDINATES.keys())

# Simulation
SIM_START_YEAR = 2025
SIM_END_YEAR   = 2040
POPULATION_GROWTH_RATE = 0.018   # 1.8% annual
CLIMATE_TEMP_RISE_PER_YEAR = 0.04  # °C

# Alerts
ALERT_POLL_INTERVAL_SECONDS = 60

# Model filenames
WATER_MODEL_PATH   = MODELS_DIR / "water_prophet.pkl"
ENERGY_MODEL_PATH  = MODELS_DIR / "energy_xgb.json"
WASTE_MODEL_PATH   = MODELS_DIR / "waste_rf.pkl"
CARBON_MODEL_PATH  = MODELS_DIR / "carbon_ridge.pkl"
SCORE_MODEL_PATH   = MODELS_DIR / "score_gbr.pkl"
ANOMALY_MODEL_PATH = MODELS_DIR / "anomaly_iso.pkl"
