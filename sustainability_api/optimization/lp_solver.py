"""
Linear Programming Optimization Engine using SciPy/PuLP.
Objective: Minimize GHG + cost while maximizing sustainability score.
Decision variables: solar_increase, waste_improvement, green_expansion,
                   water_conservation, ev_adoption, public_transport (all 0–1)
"""
import numpy as np
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Cost per unit (₹ Crore per 0→1 scale)
UNIT_COSTS = {
    "solar_increase":     500,
    "waste_improvement":  300,
    "green_expansion":    200,
    "water_conservation": 150,
    "ev_adoption":        400,
    "public_transport":   250,
}

# GHG reduction per unit (MtCO2/year)
GHG_REDUCTIONS = {
    "solar_increase":     2.5,
    "ev_adoption":        3.0,
    "public_transport":   2.0,
    "waste_improvement":  0.8,
    "green_expansion":    0.4,
    "water_conservation": 0.2,
}

# Sustainability score lift per unit (points)
SCORE_LIFTS = {
    "solar_increase":     5.0,
    "waste_improvement":  4.0,
    "green_expansion":    3.5,
    "water_conservation": 3.0,
    "ev_adoption":        2.5,
    "public_transport":   2.0,
}


def optimize_policy(
    budget_cr: float = 1500,
    target_ghg_reduction: float = 5.0,
    min_score_lift: float = 10.0,
    current_state: Optional[dict] = None,
) -> dict:
    """
    Solve LP: find optimal intervention mix.
    Returns: {variable: optimal_value, ...} + projected impact.
    """
    try:
        import pulp
        use_pulp = True
    except ImportError:
        use_pulp = False

    variables = list(UNIT_COSTS.keys())

    if use_pulp:
        prob = pulp.LpProblem("SustainabilityOptimization", pulp.LpMaximize)
        dvars = {v: pulp.LpVariable(v, lowBound=0, upBound=1) for v in variables}

        # Objective: maximize weighted sustainability score lift - normalized cost
        prob += pulp.lpSum([SCORE_LIFTS[v] * dvars[v] for v in variables]) \
             - 0.001 * pulp.lpSum([UNIT_COSTS[v] * dvars[v] for v in variables])

        # Budget constraint
        prob += pulp.lpSum([UNIT_COSTS[v] * dvars[v] for v in variables]) <= budget_cr

        # GHG reduction constraint
        prob += pulp.lpSum([GHG_REDUCTIONS[v] * dvars[v] for v in variables]) >= target_ghg_reduction

        # Minimum score lift
        prob += pulp.lpSum([SCORE_LIFTS[v] * dvars[v] for v in variables]) >= min_score_lift

        solver = pulp.PULP_CBC_CMD(msg=0)
        prob.solve(solver)
        status = pulp.LpStatus[prob.status]
        optimal = {v: round(float(dvars[v].value() or 0), 3) for v in variables}
    else:
        # Scipy fallback
        from scipy.optimize import linprog
        n = len(variables)
        # Negate score lifts (linprog minimizes)
        c = [-SCORE_LIFTS[v] for v in variables]
        # Budget constraint: sum(cost*x) <= budget
        A_ub = [[UNIT_COSTS[v] for v in variables]]
        b_ub = [budget_cr]
        # GHG: sum(ghg*x) >= target → -sum(ghg*x) <= -target
        A_ub.append([-GHG_REDUCTIONS[v] for v in variables])
        b_ub.append(-target_ghg_reduction)
        bounds = [(0, 1)] * n
        res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")
        if res.success:
            optimal = {variables[i]: round(float(res.x[i]), 3) for i in range(n)}
            status = "Optimal"
        else:
            # Greedy fallback
            optimal = _greedy_allocation(budget_cr, variables)
            status = "Feasible (greedy)"

    # Compute projected impact
    total_cost = sum(UNIT_COSTS[v] * optimal[v] for v in variables)
    total_ghg_reduction = sum(GHG_REDUCTIONS[v] * optimal[v] for v in variables)
    total_score_lift = sum(SCORE_LIFTS[v] * optimal[v] for v in variables)
    roi = (total_score_lift * 10) / max(1, total_cost) * 100

    return {
        "status": status,
        "optimal_mix": optimal,
        "projected_impact": {
            "ghg_reduction_mtco2": round(total_ghg_reduction, 2),
            "score_lift_points": round(total_score_lift, 2),
            "total_cost_cr": round(total_cost, 0),
            "roi_percent": round(roi, 1),
            "budget_used_pct": round(total_cost / budget_cr * 100, 1),
        },
        "priority_ranking": sorted(
            [{"action": v, "efficiency": round(SCORE_LIFTS[v] / UNIT_COSTS[v] * 100, 3),
              "allocated": optimal[v]} for v in variables],
            key=lambda x: x["efficiency"], reverse=True
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
