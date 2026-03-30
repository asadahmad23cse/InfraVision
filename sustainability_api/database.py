"""
Database setup: SQLAlchemy async engine with SQLite (upgradeable to PostgreSQL).
Tables: zone_timeseries, ml_predictions, alerts, scenarios, iot_readings
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    BigInteger, UniqueConstraint
)
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class ZoneTimeseries(Base):
    __tablename__ = "zone_timeseries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    zone = Column(String(30), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=True)
    population = Column(BigInteger)
    water_supply_mgd = Column(Float)
    water_demand_mgd = Column(Float)
    groundwater_extraction_mgd = Column(Float)
    groundwater_recharge_mgd = Column(Float)
    energy_consumption_mu = Column(Float)
    solar_capacity_mw = Column(Float)
    renewable_share_percent = Column(Float)
    waste_generated_tpd = Column(Float)
    waste_processed_tpd = Column(Float)
    landfill_dependency_percent = Column(Float)
    green_space_sqkm = Column(Float)
    tree_cover_percent = Column(Float)
    built_up_density_percent = Column(Float)
    ghg_emissions_mtco2 = Column(Float)
    transport_emissions_mtco2 = Column(Float)
    waste_emissions_mtco2 = Column(Float)
    sustainability_score = Column(Float)
    temperature_celsius = Column(Float)
    water_stress_index = Column(Float)
    heat_island_score = Column(Float)
    renewable_gap = Column(Float)
    waste_overflow_risk = Column(Float)
    data_source = Column(String(50), default="csv")
    ingested_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("zone", "year", "month", name="uq_zone_year_month"),)


class MlPrediction(Base):
    __tablename__ = "ml_predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_type = Column(String(30), nullable=False)
    zone = Column(String(30))
    target_year = Column(Integer)
    predicted_value = Column(Float)
    confidence_lower = Column(Float)
    confidence_upper = Column(Float)
    shap_values = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_type = Column(String(30), nullable=False)
    zone = Column(String(30))
    severity = Column(Integer)
    message = Column(Text)
    metric_name = Column(String(50))
    metric_value = Column(Float)
    threshold = Column(Float)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    interventions = Column(JSON)
    results = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class IotReading(Base):
    __tablename__ = "iot_readings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    zone = Column(String(30))
    sensor_type = Column(String(30))
    value = Column(Float)
    unit = Column(String(20))
    is_anomaly = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
