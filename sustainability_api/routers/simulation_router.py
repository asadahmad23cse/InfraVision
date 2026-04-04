"""Simulation Router: digital twin city graph, scenario comparison, stress testing."""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import ALL_ZONES

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


def _get_latest_zone_data() -> list[dict]:
    from pathlib import Path
    from config import DATA_DIR
    paths = [
        DATA_DIR / "expanded_sustainability_delhi.csv",
        Path(__file__).parent.parent.parent / "expanded_sustainable_resource_management_delhi.csv",
    ]
    for p in paths:
        if p.exists():
            df = pd.read_csv(p)
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            latest = []
            for zone in ALL_ZONES:
                zdf = df[df["zone"] == zone]
                if not zdf.empty:
                    latest.append(zdf.sort_values("year").iloc[-1].to_dict())
            return latest
    return []


def _build_initial_states(zone_data: list[dict]) -> dict[str, dict]:
    return {row["zone"]: {k: (float(v) if isinstance(v, (int, float)) else v)
                          for k, v in row.items()
                          if v is not None and (not pd.isna(v) if isinstance(v, float) else True)}
            for row in zone_data}


@router.get("/graph")
def get_city_graph():
    """Return the digital twin city graph for visualization."""
    from simulation.city_graph import build_city_graph, get_graph_export
    zone_data = _get_latest_zone_data()
    if not zone_data:
        raise HTTPException(status_code=503, detail="No data available")
    G = build_city_graph(zone_data)
    return get_graph_export(G)


@router.get("/failure/{zone}")
def simulate_failure(zone: str):
    """Simulate infrastructure failure in a zone and show cascade impact."""
    if zone not in ALL_ZONES:
        raise HTTPException(status_code=400, detail=f"Invalid zone. Must be one of {ALL_ZONES}")
    from simulation.city_graph import build_city_graph, simulate_zone_failure
    zone_data = _get_latest_zone_data()
    G = build_city_graph(zone_data)
    return simulate_zone_failure(G, zone)


class ScenarioRequest(BaseModel):
    scenarios: list[dict] = Field(
        default=[
            {"label": "Solar Push", "interventions": {"solar_increase": 0.8, "waste_improvement": 0.2}},
            {"label": "Full Green", "interventions": {"green_expansion": 0.9, "water_conservation": 0.7}},
        ],
        description="List of scenario dicts with label and interventions (0–1 scale)"
    )
    start_year: int = 2025
    end_year: int = 2035


@router.post("/compare")
def compare_scenarios_post(req: ScenarioRequest):
    """
    Run baseline + multiple scenarios and return city-level time series comparison.
    """
    from simulation.scenario_engine import compare_scenarios as cs
    zone_data = _get_latest_zone_data()
    if not zone_data:
        raise HTTPException(status_code=503, detail="No data available")
    initial_states = _build_initial_states(zone_data)
    # Patch start/end year into engine
    from simulation import scenario_engine
    scenario_engine.SIM_START_YEAR = req.start_year
    scenario_engine.SIM_END_YEAR = req.end_year
    result = cs(initial_states, req.scenarios)
    return result


@router.get("/compare")
def compare_scenarios_get(
    start_year: int = 2025,
    end_year: int = 2035,
    solar_increase: float = 0.2,
    waste_improvement: float = 0.2,
    green_expansion: float = 0.2,
    water_conservation: float = 0.2,
    ev_adoption: float = 0.2,
    public_transport: float = 0.2,
):
    """
    GET compatibility endpoint for quick scenario comparison.
    """
    req = ScenarioRequest(
        scenarios=[
            {
                "label": "Policy Mix (GET)",
                "interventions": {
                    "solar_increase": solar_increase,
                    "waste_improvement": waste_improvement,
                    "green_expansion": green_expansion,
                    "water_conservation": water_conservation,
                    "ev_adoption": ev_adoption,
                    "public_transport": public_transport,
                },
            }
        ],
        start_year=start_year,
        end_year=end_year,
    )
    return compare_scenarios_post(req)


class StressRequest(BaseModel):
    population_growth_rate: float = Field(0.025, ge=0, le=0.1)
    temp_rise_per_year: float = Field(0.05, ge=0, le=0.2)
    years: int = Field(15, ge=1, le=20)


@router.post("/stress")
def stress_test(req: StressRequest):
    """
    Infrastructure stress test: at given growth + climate rates,
    which zones exceed capacity and when?
    """
    zone_data = _get_latest_zone_data()
    if not zone_data:
        raise HTTPException(status_code=503, detail="No data available")

    results = []
    for row in zone_data:
        zone = row.get("zone")
        base_demand = float(row.get("water_demand_mgd", 300))
        base_supply = float(row.get("water_supply_mgd", 280))
        base_energy = float(row.get("energy_consumption_mu", 3800))
        base_waste = float(row.get("waste_generated_tpd", 1200))
        base_waste_cap = float(row.get("waste_processed_tpd", 700))

        water_crisis_year = None
        waste_crisis_year = None

        for i in range(req.years):
            year = 2025 + i
            factor = (1 + req.population_growth_rate) ** i
            demand = base_demand * factor
            supply = base_supply * (1 + 0.005 * i)  # slow supply growth
            waste_gen = base_waste * factor
            waste_proc = base_waste_cap * (1 + 0.01 * i)

            if demand > supply * 1.25 and water_crisis_year is None:
                water_crisis_year = year
            if waste_gen > waste_proc * 1.5 and waste_crisis_year is None:
                waste_crisis_year = year

        results.append({
            "zone": zone,
            "water_crisis_year": water_crisis_year,
            "waste_crisis_year": waste_crisis_year,
            "overall_risk": "Critical" if water_crisis_year and water_crisis_year < 2030 else
                            "High" if water_crisis_year else "Moderate",
        })

    return {
        "growth_rate": req.population_growth_rate,
        "temp_rise_per_year": req.temp_rise_per_year,
        "zones": sorted(results, key=lambda x: x["water_crisis_year"] or 9999),
    }
