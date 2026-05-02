from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any

router = APIRouter(prefix="/api/social", tags=["Social Intelligence"])

# Realistic Synthetic Social Context for Delhi Zones
SOCIAL_CONTEXT_DB = {
    "North Delhi": {
        "population_density": "high",
        "income_level": "middle",
        "infrastructure_score": 58,
        "risk_level": "medium",
        "insight": "Moderate water stress with high transit population pressure.",
        "root_cause": "Aging distribution network vs increasing population density.",
        "policy_hint": "Leakage detection + infrastructure modernization."
    },
    "South Delhi": {
        "population_density": "medium",
        "income_level": "high",
        "infrastructure_score": 82,
        "risk_level": "low",
        "insight": "High resource consumption but resilient infrastructure.",
        "root_cause": "Lifestyle-driven high per-capita water and energy use.",
        "policy_hint": "Implement progressive water tariffs + community solar."
    },
    "East Delhi": {
        "population_density": "very high",
        "income_level": "low-middle",
        "infrastructure_score": 45,
        "risk_level": "high",
        "insight": "Severe waste management and air quality challenges.",
        "root_cause": "High waste generation in narrow, congested residential pockets.",
        "policy_hint": "Micro-collection centers + green buffer zones."
    },
    "West Delhi": {
        "population_density": "high",
        "income_level": "middle",
        "infrastructure_score": 62,
        "risk_level": "medium",
        "insight": "Balanced development with localized energy grid stress.",
        "root_cause": "Industrial-residential mix causing erratic load spikes.",
        "policy_hint": "Smart grid deployment + industrial heat recovery."
    },
    "Central Delhi": {
        "population_density": "medium",
        "income_level": "high",
        "infrastructure_score": 88,
        "risk_level": "low",
        "insight": "Critical administrative hub with prioritized infrastructure.",
        "root_cause": "High security and visibility requirements lead to better maintenance.",
        "policy_hint": "Zero-emission zone pilot + EV-only public transit."
    },
    "North-West Delhi": {
        "population_density": "high",
        "income_level": "middle",
        "infrastructure_score": 55,
        "risk_level": "medium",
        "insight": "Expanding residential areas outstripping water supply lines.",
        "root_cause": "Rapid urbanization without proportional pipeline expansion.",
        "policy_hint": "New reservoir construction + pipeline augmentation."
    },
    "North-East Delhi": {
        "population_density": "very high",
        "income_level": "low",
        "infrastructure_score": 38,
        "risk_level": "high",
        "insight": "High vulnerability to heatwaves and flash floods due to poor drainage.",
        "root_cause": "Informal settlements and lack of planned drainage systems.",
        "policy_hint": "Emergency climate shelters + drainage overhaul."
    },
    "South-West Delhi": {
        "population_density": "medium",
        "income_level": "middle-high",
        "infrastructure_score": 70,
        "risk_level": "low-medium",
        "insight": "Institutional and residential growth requiring energy stability.",
        "root_cause": "Large institutional loads (airports/universities) stressing the grid.",
        "policy_hint": "Rooftop solar mandates for institutions."
    },
    "South-East Delhi": {
        "population_density": "high",
        "income_level": "middle",
        "infrastructure_score": 60,
        "risk_level": "medium",
        "insight": "Logistics and industrial hub with high GHG emissions.",
        "root_cause": "Intense truck traffic and industrial fuel consumption.",
        "policy_hint": "Electrification of logistics + green corridors."
    }
}

@router.get("/context")
def get_social_context(zone: str = Query(..., description="Zone name")):
    context = SOCIAL_CONTEXT_DB.get(zone)
    if not context:
        # Generic fallback
        return {
            "zone": zone,
            "population_density": "medium",
            "income_level": "middle",
            "infrastructure_score": 50,
            "risk_level": "medium",
            "insight": "Standard urban sustainability profile.",
            "root_cause": "Balanced urban growth vs resource constraints.",
            "policy_hint": "Maintain existing infrastructure + gradual upgrades."
        }
    return {"zone": zone, **context}
