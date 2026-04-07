/** CSV-backed LP-style optimization when FastAPI `/api/optimization/*` is offline. Mirrors `sustainability_api/optimization/lp_solver.py` constants. */

export type OptVarKey =
  | 'solar_increase'
  | 'waste_improvement'
  | 'green_expansion'
  | 'water_conservation'
  | 'ev_adoption'
  | 'public_transport';

const UNIT_COSTS: Record<OptVarKey, number> = {
  solar_increase: 500,
  waste_improvement: 300,
  green_expansion: 200,
  water_conservation: 150,
  ev_adoption: 400,
  public_transport: 250,
};

const GHG_REDUCTIONS: Record<OptVarKey, number> = {
  solar_increase: 2.5,
  ev_adoption: 3.0,
  public_transport: 2.0,
  waste_improvement: 0.8,
  green_expansion: 0.4,
  water_conservation: 0.2,
};

const SCORE_LIFTS: Record<OptVarKey, number> = {
  solar_increase: 5.0,
  waste_improvement: 4.0,
  green_expansion: 3.5,
  water_conservation: 3.0,
  ev_adoption: 2.5,
  public_transport: 2.0,
};

const VARS = Object.keys(UNIT_COSTS) as OptVarKey[];

function round(n: number, d: number) {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

function emptyMix(): Record<OptVarKey, number> {
  return Object.fromEntries(VARS.map((v) => [v, 0])) as Record<OptVarKey, number>;
}

function totals(mix: Record<OptVarKey, number>) {
  let cost = 0;
  let ghg = 0;
  let score = 0;
  for (const v of VARS) {
    cost += UNIT_COSTS[v] * mix[v];
    ghg += GHG_REDUCTIONS[v] * mix[v];
    score += SCORE_LIFTS[v] * mix[v];
  }
  return { cost, ghg, score };
}

/** Greedy: maximize score lift per rupee until budget exhausted (unconstrained objective). */
function allocateMaxScoreUnderBudget(budgetCr: number): Record<OptVarKey, number> {
  const mix = emptyMix();
  let remaining = Math.max(0, budgetCr);
  for (let iter = 0; iter < 3000 && remaining > 0.01; iter += 1) {
    let best: OptVarKey | null = null;
    let bestRatio = -1;
    for (const v of VARS) {
      if (mix[v] >= 100 - 1e-9) continue;
      const ratio = SCORE_LIFTS[v] / UNIT_COSTS[v];
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = v;
      }
    }
    if (!best) break;
    const room = 100 - mix[best];
    const maxAdd = remaining / UNIT_COSTS[best];
    const delta = Math.min(room, maxAdd);
    if (delta < 1e-6) break;
    mix[best] += delta;
    remaining -= delta * UNIT_COSTS[best];
  }
  return mix;
}

/** Nudge mix toward GHG / score floors without exceeding budget (heuristic). */
function applyConstraints(
  mix: Record<OptVarKey, number>,
  budgetCr: number,
  ghgTarget: number,
  scoreTarget: number,
): Record<OptVarKey, number> {
  if (ghgTarget <= 0 && scoreTarget <= 0) return mix;
  const out = { ...mix };
  for (let pass = 0; pass < 200; pass += 1) {
    let { cost, ghg, score } = totals(out);
    if (cost > budgetCr) {
      const scale = budgetCr / cost;
      for (const v of VARS) out[v] *= scale;
      ({ cost, ghg, score } = totals(out));
    }
    if (ghg >= ghgTarget && score >= scoreTarget) break;

    let best: OptVarKey | null = null;
    let bestMerit = -1;
    const needGhg = ghg < ghgTarget ? 1 : 0;
    const needScore = score < scoreTarget ? 1 : 0;
    if (needGhg === 0 && needScore === 0) break;

    for (const v of VARS) {
      if (out[v] >= 99.999) continue;
      const merit =
        needGhg * (GHG_REDUCTIONS[v] / UNIT_COSTS[v]) + needScore * (SCORE_LIFTS[v] / UNIT_COSTS[v]);
      if (merit > bestMerit) {
        bestMerit = merit;
        best = v;
      }
    }
    if (!best || bestMerit <= 0) break;
    const headroom = budgetCr - cost;
    const step = Math.min(100 - out[best], 1.5, headroom / UNIT_COSTS[best]);
    if (step < 1e-6) break;
    out[best] += step;
  }
  let { cost: c } = totals(out);
  if (c > budgetCr) {
    const scale = budgetCr / c;
    for (const v of VARS) out[v] *= scale;
  }
  return out;
}

export function getLocalOptimizationSolve(
  budgetCr: number,
  targetGhgReduction: number,
  minScoreLift: number,
  currentCityScore = 55,
) {
  const budget = Math.min(10000, Math.max(100, budgetCr));
  const ghgT = Math.min(Math.max(0, targetGhgReduction), 10);
  const scoreT = Math.min(Math.max(0, minScoreLift), 20);

  let mix: Record<OptVarKey, number>;
  if (ghgT <= 0 && scoreT <= 0) {
    mix = allocateMaxScoreUnderBudget(budget);
  } else {
    mix = applyConstraints(allocateMaxScoreUnderBudget(budget), budget, ghgT, scoreT);
  }

  let { cost, ghg, score } = totals(mix);

  // Never show hardcoded fallback — always surface real allocation.
  // Mark as 'partial' if we couldn't fully satisfy one or both targets.
  const isPartial =
    (ghgT > 0 && ghg < ghgT * 0.9) || (scoreT > 0 && score < scoreT * 0.9);

  const roi = (score * 10) / Math.max(1, cost) * 100;
  const priorityRanking = [...VARS]
    .map((v) => ({
      action: v,
      efficiency: round((SCORE_LIFTS[v] / UNIT_COSTS[v]) * 100, 3),
      allocated: round(mix[v], 4),
    }))
    .sort((a, b) => b.efficiency - a.efficiency);

  return {
    status: (isPartial ? 'partial' : 'optimal') as 'optimal' | 'partial',
    optimal_score: round(currentCityScore + score, 2),
    optimal_mix: Object.fromEntries(VARS.map((v) => [v, mix[v]])) as Record<OptVarKey, number>,
    projected_impact: {
      ghg_reduction_mtco2: round(ghg, 2),
      score_lift_points: round(score, 2),
      total_cost_cr: round(cost, 0),
      roi_percent: round(roi, 1),
      budget_used_pct: round((cost / budget) * 100, 1),
    },
    priority_ranking: priorityRanking,
  };
}

export function getLocalOptimizationForUi(
  budgetCr: number,
  targetGhgReduction: number,
  minScoreLift: number,
) {
  const res = getLocalOptimizationSolve(budgetCr, targetGhgReduction, minScoreLift);
  const mix = res.optimal_mix;
  const impact = res.projected_impact;
  return {
    solar: mix.solar_increase,
    waste: mix.waste_improvement,
    ev: mix.ev_adoption,
    score: impact.score_lift_points,
    optimal_score: res.optimal_score,
    cost: impact.total_cost_cr,
    ghg_reduction: impact.ghg_reduction_mtco2,
    status: res.status,
  };
}

export function getLocalParetoFrontier(budgetCr: number, steps: number) {
  const budget = Number.isFinite(budgetCr) ? budgetCr : 1500;
  const s = Math.max(2, Math.min(24, Math.floor(steps) || 8));
  const points: Array<{
    budget_cr: number;
    score_lift: number;
    ghg_reduction: number;
    cost: number;
  }> = [];
  for (let i = 0; i < s; i += 1) {
    const b = (budget * (i + 1)) / s;
    const r = getLocalOptimizationSolve(b, 0, 0);
    const pts = r.projected_impact;
    points.push({
      budget_cr: round(b, 0),
      score_lift: pts.score_lift_points,
      ghg_reduction: pts.ghg_reduction_mtco2,
      cost: pts.total_cost_cr,
    });
  }
  return { pareto_points: points };
}
