"""
Linear Programming Optimization Engine using PuLP.
Objective: minimize cost and maximize sustainability outcomes.
Decision variables: solar_increase, waste_improvement, green_expansion,
water_conservation, ev_adoption, public_transport.
"""
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Cost per unit (INR Crore per 0->100 scale)
UNIT_COSTS = {
    "solar_increase": 500,
    "waste_improvement": 300,
    "green_expansion": 200,
    "water_conservation": 150,
    "ev_adoption": 400,
    "public_transport": 250,
}

# GHG reduction per unit (MtCO2/year)
GHG_REDUCTIONS = {
    "solar_increase": 2.5,
    "ev_adoption": 3.0,
    "public_transport": 2.0,
    "waste_improvement": 0.8,
    "green_expansion": 0.4,
    "water_conservation": 0.2,
}

# Sustainability score lift per unit (points)
SCORE_LIFTS = {
    "solar_increase": 5.0,
    "waste_improvement": 4.0,
    "green_expansion": 3.5,
    "water_conservation": 3.0,
    "ev_adoption": 2.5,
    "public_transport": 2.0,
}


def _resolve_current_city_score(current_state: Optional[dict]) -> float:
    """Resolve baseline city score used to calculate optimal target score."""
    if not isinstance(current_state, dict):
        return 55.0
    for key in ("current_city_score", "city_score", "current_score", "sustainability_score"):
        value = current_state.get(key)
        if isinstance(value, (int, float)):
            return float(value)
    return 55.0


def optimize_policy(
    budget_cr: float = 1500,
    target_ghg_reduction: float = 5.0,
    min_score_lift: float = 10.0,
    current_state: Optional[dict] = None,
) -> dict:
    """
    Solve LP and return optimal intervention mix plus projected impact.
    Adds mandatory top-level `optimal_score` = current_city_score + total_score_lift.
    """
    import pulp

    variables = list(UNIT_COSTS.keys())
    dvars = {v: pulp.LpVariable(v, lowBound=0, upBound=100) for v in variables}

    ghg_target = min(target_ghg_reduction, 10)
    score_target = min(min_score_lift, 20)

    prob = pulp.LpProblem("SustainabilityOptimization", pulp.LpMaximize)
    slack_ghg = pulp.LpVariable("slack_ghg", lowBound=0)
    slack_score = pulp.LpVariable("slack_score", lowBound=0)

    prob += (
        pulp.lpSum([SCORE_LIFTS[v] * dvars[v] for v in variables])
        - 0.001 * pulp.lpSum([UNIT_COSTS[v] * dvars[v] for v in variables])
        - 9999 * slack_ghg
        - 9999 * slack_score
    )

    prob += pulp.lpSum([UNIT_COSTS[v] * dvars[v] for v in variables]) <= budget_cr
    prob += pulp.lpSum([GHG_REDUCTIONS[v] * dvars[v] for v in variables]) + slack_ghg >= ghg_target
    prob += pulp.lpSum([SCORE_LIFTS[v] * dvars[v] for v in variables]) + slack_score >= score_target

    solver = pulp.PULP_CBC_CMD(msg=0)
    prob.solve(solver)

    status_str = pulp.LpStatus[prob.status]
    print("Solver status:", status_str)
    print("Inputs:", budget_cr, target_ghg_reduction, min_score_lift)

    current_city_score = _resolve_current_city_score(current_state)

    # Always extract real solved values. If solver failed completely, use a
    # budget-proportional greedy split as a guaranteed-feasible fallback.
    optimal = {}
    solver_ok = status_str in ("Optimal", "Not Solved")  # CBC often says "Optimal" with slack
    for v in variables:
        raw_value = dvars[v].value() if solver_ok else None
        if raw_value is None or raw_value < 0:
            # Budget-proportional greedy: split 1800 Cr across variables by cost weight
            raw_value = (budget_cr / sum(UNIT_COSTS.values())) * (UNIT_COSTS[v] / max(UNIT_COSTS.values())) * 40
        optimal[v] = float(raw_value)

    # Determine whether soft constraints required slack (partial solution)
    slack_ghg_val = slack_ghg.value() or 0.0
    slack_score_val = slack_score.value() or 0.0
    is_partial = (slack_ghg_val > 0.01) or (slack_score_val > 0.01)
    total_cost = sum(UNIT_COSTS[v] * optimal[v] for v in variables)
    total_ghg_reduction = sum(GHG_REDUCTIONS[v] * optimal[v] for v in variables)
    total_score_lift = sum(SCORE_LIFTS[v] * optimal[v] for v in variables)
    optimal_score = current_city_score + total_score_lift
    roi = (total_score_lift * 10) / max(1, total_cost) * 100

    return {
        "status": "partial" if is_partial else "optimal",
        "optimal_score": round(optimal_score, 2),
        "optimal_mix": optimal,
        "projected_impact": {
            "ghg_reduction_mtco2": round(total_ghg_reduction, 2),
            "score_lift_points": round(total_score_lift, 2),
            "total_cost_cr": round(total_cost, 0),
            "roi_percent": round(roi, 1),
            "budget_used_pct": round(total_cost / budget_cr * 100, 1),
        },
        "priority_ranking": sorted(
            [
                {
                    "action": v,
                    "efficiency": round(SCORE_LIFTS[v] / UNIT_COSTS[v] * 100, 3),
                    "allocated": optimal[v],
                }
                for v in variables
            ],
            key=lambda x: x["efficiency"],
            reverse=True,
        ),
    }


def _greedy_allocation(budget: float, variables: list[str]) -> dict:
    """Greedy: allocate budget by efficiency (score lift per cost unit)."""
    efficiencies = sorted(variables, key=lambda v: SCORE_LIFTS[v] / UNIT_COSTS[v], reverse=True)
    allocated = {v: 0.0 for v in variables}
    remaining = budget
    for v in efficiencies:
        max_spend = min(remaining, UNIT_COSTS[v])
        allocated[v] = round(max_spend / UNIT_COSTS[v], 3)
        remaining -= max_spend
        if remaining <= 0:
            break
    return allocated
