"""
Scenario Engine: year-by-year simulation for baseline vs intervention scenarios.
Supports: population growth, climate impact, policy interventions.
"""
import numpy as np
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import SIM_START_YEAR, SIM_END_YEAR, POPULATION_GROWTH_RATE, CLIMATE_TEMP_RISE_PER_YEAR


def _evolve_zone(state: dict, year: int, interventions: dict, base_year: int = 2022) -> dict:
    """Advance a zone's state by one year applying interventions."""
    t = year - base_year
    state = state.copy()

    # Population growth
    state["population"] = state["population"] * (1 + POPULATION_GROWTH_RATE)

    # Water: demand grows with population, supply improves with water_conservation
    demand_growth = 1.018
    supply_boost = 1 + interventions.get("water_conservation", 0) * 0.03
    state["water_demand_mgd"] *= demand_growth
    state["water_supply_mgd"] = min(state["water_demand_mgd"], state["water_supply_mgd"] * supply_boost)

    # Energy: grows with population but reduced by renewables
    energy_growth = 1.015
    solar_boost = interventions.get("solar_increase", 0)
    state["energy_consumption_mu"] *= energy_growth * (1 - solar_boost * 0.02)
    state["solar_capacity_mw"] *= (1 + solar_boost * 0.12)
    state["renewable_share_percent"] = min(
        30, state["renewable_share_percent"] + solar_boost * 0.8
    )

    # Waste
    waste_growth = 1.02
    waste_boost = interventions.get("waste_improvement", 0)
    state["waste_generated_tpd"] *= waste_growth
    state["waste_processed_tpd"] = min(
        state["waste_generated_tpd"],
        state["waste_processed_tpd"] * (1 + waste_boost * 0.05)
    )
    state["landfill_dependency_percent"] = max(
        10,
        (state["waste_generated_tpd"] - state["waste_processed_tpd"])
        / state["waste_generated_tpd"] * 100
    )

    # Green space
    green_boost = interventions.get("green_expansion", 0)
    state["green_space_sqkm"] += green_boost * 0.5  # 0.5 sqkm per unit per year
    state["tree_cover_percent"] = min(30, state["tree_cover_percent"] + green_boost * 0.2)

    # GHG
    energy_ghg = state["energy_consumption_mu"] * 0.00015  # emission factor
    transport_boost = interventions.get("ev_adoption", 0) + interventions.get("public_transport", 0)
    transport_reduction = 1 - transport_boost * 0.12
    state["ghg_emissions_mtco2"] = max(
        0.5,
        energy_ghg * (1 - state["renewable_share_percent"] / 100) * 0.58
        + state.get("transport_emissions_mtco2", 2.0) * transport_reduction
        + state.get("waste_emissions_mtco2", 0.5) * (1 - waste_boost * 0.1)
    )

    # Sustainability score (simplified update)
    supply = state["water_supply_mgd"]
    demand = state["water_demand_mgd"] or 1
    ws = min(100, supply / demand * 100)
    es = min(100, state["renewable_share_percent"] * 5)
    wts = min(100, state["waste_processed_tpd"] / max(1, state["waste_generated_tpd"]) * 100)
    pop = state["population"] or 1
    gs = min(100, (state["green_space_sqkm"] * 1e6 / pop / 9) * 50 + state["tree_cover_percent"] * 2)
    ems = max(0, min(100, 100 - (state["ghg_emissions_mtco2"] / 6 - 1) * 40))
    state["sustainability_score"] = round(ws * 0.25 + es * 0.20 + wts * 0.20 + gs * 0.20 + ems * 0.15, 2)

    return state


def run_scenario(
    initial_states: dict[str, dict],
    interventions: dict,
    start_year: int = SIM_START_YEAR,
    end_year: int = SIM_END_YEAR,
    label: str = "scenario",
) -> dict:
    """
    Simulate all zones year-by-year with given interventions.
    Returns: {year: {zone: state_dict}}
    """
    results: dict[int, dict[str, dict]] = {}
    current_states = {z: s.copy() for z, s in initial_states.items()}

    for year in range(start_year, end_year + 1):
        year_results = {}
        for zone, state in current_states.items():
            new_state = _evolve_zone(state, year, interventions)
            current_states[zone] = new_state
            year_results[zone] = {
                "year": year,
                "zone": zone,
                "sustainability_score": new_state["sustainability_score"],
                "water_stress_index": round(max(0, new_state["water_demand_mgd"] - new_state["water_supply_mgd"]) / max(1, new_state["water_demand_mgd"]), 3),
                "ghg_emissions_mtco2": round(new_state["ghg_emissions_mtco2"], 3),
                "renewable_share_percent": round(new_state["renewable_share_percent"], 2),
                "waste_processed_pct": round(new_state["waste_processed_tpd"] / max(1, new_state["waste_generated_tpd"]) * 100, 1),
                "green_sqm_per_capita": round(new_state["green_space_sqkm"] * 1e6 / max(1, new_state["population"]), 2),
            }
        results[year] = year_results

    return {"label": label, "interventions": interventions, "simulation": results}


def compare_scenarios(
    initial_states: dict[str, dict],
    scenarios: list[dict],
) -> dict:
    """
    Run multiple scenarios and return comparison.
    scenarios = [{"label": "...", "interventions": {...}}, ...]
    """
    baseline_ints = {k: 0.0 for k in ["solar_increase", "waste_improvement", "green_expansion",
                                        "water_conservation", "ev_adoption", "public_transport"]}
    baseline = run_scenario(initial_states, baseline_ints, label="Baseline")
    results = [baseline]

    for scenario in scenarios:
        result = run_scenario(
            initial_states,
            scenario["interventions"],
            label=scenario["label"]
        )
        results.append(result)

    # Aggregate city-level time series per scenario
    city_timeseries = []
    for result in results:
        label = result["label"]
        for year, zone_data in result["simulation"].items():
            scores = [zd["sustainability_score"] for zd in zone_data.values()]
            ghg = sum(zd["ghg_emissions_mtco2"] for zd in zone_data.values())
            city_timeseries.append({
                "label": label,
                "year": year,
                "avg_score": round(sum(scores) / len(scores), 2),
                "total_ghg": round(ghg, 2),
            })

    return {
        "scenarios": results,
        "city_timeseries": city_timeseries,
    }
