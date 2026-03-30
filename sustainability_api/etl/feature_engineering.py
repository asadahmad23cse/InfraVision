"""Feature engineering: computes derived sustainability indicators from raw row data."""

WHO_GREEN_TARGET_SQM = 9.0   # WHO standard: 9 sqm green space per capita
BASELINE_GHG = 55.0          # MtCO2 reference for Delhi
TARGET_RENEWABLE_PCT = 20.0  # % renewable target


def engineer_features(row: dict) -> dict:
    """
    Input: dict with raw zone row fields.
    Output: dict with engineered features merged in.
    """
    feats: dict = {}

    # --- Water Stress Index (0=safe, 1=critical) ---
    supply = row.get("water_supply_mgd") or 0
    demand = row.get("water_demand_mgd") or 1
    if demand > 0:
        feats["water_stress_index"] = round(max(0.0, min(1.0, (demand - supply) / demand)), 4)
    else:
        feats["water_stress_index"] = 0.0

    # --- Heat Island Score (0=low, 10=high) ---
    built_up = row.get("built_up_density_percent") or 0
    green_sqkm = row.get("green_space_sqkm") or 0
    tree_pct = row.get("tree_cover_percent") or 0
    # Higher built-up + lower green → higher heat island
    heat = (built_up / 100) * 8 - ((green_sqkm / 50) * 4) - (tree_pct / 100) * 4
    feats["heat_island_score"] = round(max(0.0, min(10.0, heat)), 2)

    # --- Renewable Gap (how far from target) ---
    renewable = row.get("renewable_share_percent") or 0
    feats["renewable_gap"] = round(max(0.0, TARGET_RENEWABLE_PCT - renewable), 2)

    # --- Waste Overflow Risk (0=fine, 1=critical) ---
    waste_gen = row.get("waste_generated_tpd") or 1
    waste_proc = row.get("waste_processed_tpd") or 0
    landfill_pct = row.get("landfill_dependency_percent") or 0
    overflow = (waste_gen - waste_proc) / waste_gen if waste_gen > 0 else 0
    feats["waste_overflow_risk"] = round(max(0.0, min(1.0, overflow * (landfill_pct / 100 + 0.1))), 4)

    # --- Green Space Per Capita (sqm) ---
    population = row.get("population") or 1
    feats["green_sqm_per_capita"] = round((green_sqkm * 1e6) / population, 2) if population > 0 else 0

    # --- Carbon Intensity (GHG per energy unit) ---
    energy_mu = row.get("energy_consumption_mu") or 1
    ghg = row.get("ghg_emissions_mtco2") or 0
    feats["carbon_intensity"] = round(ghg / energy_mu if energy_mu > 0 else 0, 6)

    # --- Temperature (default seasonal estimate for Delhi) ---
    if "temperature_celsius" not in row or not row.get("temperature_celsius"):
        feats["temperature_celsius"] = 28.0
    else:
        feats["temperature_celsius"] = row["temperature_celsius"]

    return feats


def build_feature_vector(row: dict) -> list[float]:
    """Returns ordered feature list for ML models."""
    feats = engineer_features(row)
    return [
        float(row.get("population", 0)),
        float(row.get("water_supply_mgd", 0)),
        float(row.get("water_demand_mgd", 0)),
        float(row.get("energy_consumption_mu", 0)),
        float(row.get("solar_capacity_mw", 0)),
        float(row.get("renewable_share_percent", 0)),
        float(row.get("waste_generated_tpd", 0)),
        float(row.get("waste_processed_tpd", 0)),
        float(row.get("landfill_dependency_percent", 0)),
        float(row.get("green_space_sqkm", 0)),
        float(row.get("tree_cover_percent", 0)),
        float(row.get("built_up_density_percent", 0)),
        float(row.get("ghg_emissions_mtco2", 0)),
        float(feats["water_stress_index"]),
        float(feats["heat_island_score"]),
        float(feats["renewable_gap"]),
        float(feats["waste_overflow_risk"]),
        float(feats["temperature_celsius"]),
    ]


FEATURE_NAMES = [
    "population", "water_supply_mgd", "water_demand_mgd",
    "energy_consumption_mu", "solar_capacity_mw", "renewable_share_percent",
    "waste_generated_tpd", "waste_processed_tpd", "landfill_dependency_percent",
    "green_space_sqkm", "tree_cover_percent", "built_up_density_percent",
    "ghg_emissions_mtco2", "water_stress_index", "heat_island_score",
    "renewable_gap", "waste_overflow_risk", "temperature_celsius",
]
