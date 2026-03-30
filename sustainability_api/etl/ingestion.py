"""ETL Ingestion: loads CSV data into DB and optionally fetches weather from OpenWeather."""
import asyncio
import pandas as pd
import httpx
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import DATA_DIR, OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL, ZONE_COORDINATES
from database import ZoneTimeseries, AsyncSessionLocal
from etl.feature_engineering import engineer_features

CSV_PATH = DATA_DIR / "expanded_sustainability_delhi.csv"
FALLBACK_CSV = Path(__file__).parent.parent.parent / "expanded_sustainable_resource_management_delhi.csv"

# Default temperature by season (fallback when no API key)
MONTHLY_TEMP = {1:14,2:17,3:23,4:31,5:37,6:35,7:30,8:29,9:28,10:25,11:19,12:14}


async def fetch_temperature(zone: str) -> float:
    """Fetch current temperature for a zone from OpenWeather. Falls back to seasonal average."""
    if not OPENWEATHER_API_KEY:
        import datetime
        month = datetime.datetime.now().month
        # Add zone-specific offset
        offsets = {"North":0,"South":0.5,"East":0.3,"West":-0.2,"Central":1.1,
                   "North-East":0.2,"North-West":-0.3,"South-West":0.4,"South-East":0.6}
        return MONTHLY_TEMP[month] + offsets.get(zone, 0)
    lat, lon = ZONE_COORDINATES[zone]
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(OPENWEATHER_BASE_URL, params={
                "lat": lat, "lon": lon,
                "appid": OPENWEATHER_API_KEY, "units": "metric"
            })
            if r.status_code == 200:
                return r.json()["main"]["temp"]
    except Exception:
        pass
    import datetime
    return MONTHLY_TEMP[datetime.datetime.now().month]


async def load_csv_to_db(session: AsyncSession) -> int:
    """Load zone-level CSV into zone_timeseries table. Skips existing rows."""
    csv = CSV_PATH if CSV_PATH.exists() else FALLBACK_CSV
    if not csv.exists():
        return 0

    df = pd.read_csv(csv)
    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Check if already loaded
    result = await session.execute(text("SELECT COUNT(*) FROM zone_timeseries"))
    count = result.scalar()
    if count and count > 0:
        return count

    rows_added = 0
    for _, row in df.iterrows():
        features = engineer_features(row.to_dict())
        obj = ZoneTimeseries(
            zone=row.get("zone", "Unknown"),
            year=int(row.get("year", 2022)),
            month=None,
            population=int(row.get("population", 0)),
            water_supply_mgd=row.get("water_supply_mgd"),
            water_demand_mgd=row.get("water_demand_mgd"),
            groundwater_extraction_mgd=row.get("groundwater_extraction_mgd"),
            groundwater_recharge_mgd=row.get("groundwater_recharge_mgd"),
            energy_consumption_mu=row.get("energy_consumption_mu"),
            solar_capacity_mw=row.get("solar_capacity_mw"),
            renewable_share_percent=row.get("renewable_share_percent"),
            waste_generated_tpd=row.get("waste_generated_tpd"),
            waste_processed_tpd=row.get("waste_processed_tpd"),
            landfill_dependency_percent=row.get("landfill_dependency_percent"),
            green_space_sqkm=row.get("green_space_sqkm"),
            tree_cover_percent=row.get("tree_cover_percent"),
            built_up_density_percent=row.get("built_up_density_percent"),
            ghg_emissions_mtco2=row.get("ghg_emissions_mtco2"),
            transport_emissions_mtco2=row.get("transport_emissions_mtco2"),
            waste_emissions_mtco2=row.get("waste_emissions_mtco2"),
            sustainability_score=row.get("sustainability_score"),
            temperature_celsius=features.get("temperature_celsius", 28.0),
            water_stress_index=features.get("water_stress_index"),
            heat_island_score=features.get("heat_island_score"),
            renewable_gap=features.get("renewable_gap"),
            waste_overflow_risk=features.get("waste_overflow_risk"),
            data_source="csv",
        )
        session.add(obj)
        rows_added += 1

    await session.commit()
    return rows_added


async def run_ingestion():
    """Entry point for ingestion pipeline."""
    async with AsyncSessionLocal() as session:
        n = await load_csv_to_db(session)
    return n
