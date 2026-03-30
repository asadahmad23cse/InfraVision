"""
AI Decision Engine: Rule-based + ML hybrid recommendation system.
For each zone, detects problems, ranks severity, and generates top interventions with
impact, cost, ROI, and time-to-implement estimates.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import ALL_ZONES

# Severity rules (higher = more urgent)
RULES = [
    {
        "id": "water_critical",
        "check": lambda r: (r.get("water_demand_mgd", 0) or 0) > (r.get("water_supply_mgd", 1) or 1) * 1.20,
        "severity": 10,
        "alert_type": "WATER_STRESS",
        "risk": "Water",
        "action": "Expand water supply capacity & implement 24x7 metered supply",
        "impact": "Reduce water stress index by 0.3",
        "cost_cr": 180,
        "timeline_years": 3,
        "co_benefits": ["Reduce groundwater extraction", "Improve public health"],
    },
    {
        "id": "water_high",
        "check": lambda r: (r.get("water_demand_mgd", 0) or 0) > (r.get("water_supply_mgd", 1) or 1) * 1.05,
        "severity": 7,
        "alert_type": "WATER_STRESS",
        "risk": "Water",
        "action": "Deploy rainwater harvesting & wastewater recycling programs",
        "impact": "Reduce per-capita water demand by 15%",
        "cost_cr": 90,
        "timeline_years": 2,
        "co_benefits": ["Groundwater recharge", "Reduced DJB bill"],
    },
    {
        "id": "waste_critical",
        "check": lambda r: (r.get("landfill_dependency_percent", 0) or 0) > 55,
        "severity": 9,
        "alert_type": "WASTE_OVERFLOW",
        "risk": "Waste",
        "action": "Build new material recovery facilities & ban single-use plastics",
        "impact": "Divert 40% waste from landfill within 2 years",
        "cost_cr": 120,
        "timeline_years": 2,
        "co_benefits": ["Reduce methane emissions", "Circular economy jobs"],
    },
    {
        "id": "waste_high",
        "check": lambda r: (r.get("landfill_dependency_percent", 0) or 0) > 35,
        "severity": 6,
        "alert_type": "WASTE_OVERFLOW",
        "risk": "Waste",
        "action": "Scale up waste-to-energy plants & composting capacity",
        "impact": "Process 20% additional waste daily",
        "cost_cr": 75,
        "timeline_years": 3,
        "co_benefits": ["Power generation", "Reduced odour & disease"],
    },
    {
        "id": "solar_critical",
        "check": lambda r: (r.get("renewable_share_percent", 0) or 0) < 1.5,
        "severity": 8,
        "alert_type": "ENERGY_CRISIS",
        "risk": "Energy",
        "action": "Emergency rooftop solar deployment (500 MW target)",
        "impact": "Add 500 MW solar, reduce GHG by 2.5 MtCO2/yr",
        "cost_cr": 250,
        "timeline_years": 2,
        "co_benefits": ["Energy security", "Reduced electricity bills"],
    },
    {
        "id": "solar_low",
        "check": lambda r: (r.get("renewable_share_percent", 0) or 0) < 5,
        "severity": 5,
        "alert_type": "LOW_RENEWABLE",
        "risk": "Energy",
        "action": "Solar rooftop mandate for commercial buildings + subsidies",
        "impact": "Renewable share from 2% → 10% in 3 years",
        "cost_cr": 150,
        "timeline_years": 3,
        "co_benefits": ["Air quality", "GHG reduction"],
    },
    {
        "id": "green_critical",
        "check": lambda r: (
            (r.get("green_space_sqkm", 0) or 0) * 1e6 / max(1, r.get("population", 1) or 1)
        ) < 2.0,
        "severity": 8,
        "alert_type": "GREEN_DEFICIT",
        "risk": "Green",
        "action": "Emergency urban forest creation + rooftop gardens mandate",
        "impact": "Add 15 sqkm green space, reduce urban heat by 2°C",
        "cost_cr": 100,
        "timeline_years": 4,
        "co_benefits": ["Heat island reduction", "Mental health", "Air quality"],
    },
    {
        "id": "green_low",
        "check": lambda r: (
            (r.get("green_space_sqkm", 0) or 0) * 1e6 / max(1, r.get("population", 1) or 1)
        ) < 5.0,
        "severity": 5,
        "alert_type": "GREEN_DEFICIT",
        "risk": "Green",
        "action": "Develop linear parks, green corridors, and tree plantation drives",
        "impact": "Increase green cover by 20%",
        "cost_cr": 60,
        "timeline_years": 3,
        "co_benefits": ["Biodiversity", "Stormwater management"],
    },
    {
        "id": "ghg_critical",
        "check": lambda r: (r.get("ghg_emissions_mtco2", 0) or 0) > 6.5,
        "severity": 9,
        "alert_type": "CARBON_SPIKE",
        "risk": "Emissions",
        "action": "Accelerate EV adoption + expand metro + phase out coal boilers",
        "impact": "Reduce transport GHG by 30%, total GHG by 15%",
        "cost_cr": 300,
        "timeline_years": 5,
        "co_benefits": ["Air quality", "Public health savings"],
    },
    {
        "id": "groundwater",
        "check": lambda r: (r.get("groundwater_extraction_mgd", 0) or 0) > (r.get("groundwater_recharge_mgd", 1) or 1) * 1.1,
        "severity": 7,
        "alert_type": "GROUNDWATER_STRESS",
        "risk": "Water",
        "action": "Aquifer recharge programs (check dams, percolation pits)",
        "impact": "Recharge groundwater by 15% within 2 years",
        "cost_cr": 70,
        "timeline_years": 2,
        "co_benefits": ["Long-term water security", "Reduced subsidence risk"],
    },
]


def get_zone_recommendations(zone: str, row: dict) -> dict:
    """
    For a given zone and its latest data row:
    - Apply all rules
    - Sort by severity
    - Return top 5 interventions with ROI calculations
    """
    triggered = []
    for rule in RULES:
        try:
            if rule["check"](row):
                cost = rule["cost_cr"]
                score_impact = max(1.0, (rule["severity"] / 10) * 15)
                roi = score_impact * 10 / max(1, cost) * 100
                triggered.append({
                    **{k: v for k, v in rule.items() if k != "check"},
                    "roi_percent": round(roi, 2),
                    "score_impact_points": round(score_impact, 1),
                })
        except Exception:
            continue

    triggered.sort(key=lambda x: x["severity"], reverse=True)

    current_score = row.get("sustainability_score", 55) or 55
    score_after = min(100, current_score + sum(t["score_impact_points"] for t in triggered[:3]))

    return {
        "zone": zone,
        "current_score": round(float(current_score), 1),
        "projected_score_with_top3": round(float(score_after), 1),
        "alerts_count": len(triggered),
        "biggest_risk": triggered[0]["risk"] if triggered else "None",
        "urgency": "Critical" if triggered and triggered[0]["severity"] >= 9 else
                   "High" if triggered and triggered[0]["severity"] >= 7 else
                   "Medium" if triggered else "Low",
        "top_interventions": triggered[:5],
    }


def get_all_zones_summary(zone_rows: list[dict]) -> list[dict]:
    """Batch recommendations for all zones."""
    results = []
    for row in zone_rows:
        zone = row.get("zone", "Unknown")
        rec = get_zone_recommendations(zone, row)
        results.append(rec)
    results.sort(key=lambda x: x["current_score"])  # worst zones first
    return results
