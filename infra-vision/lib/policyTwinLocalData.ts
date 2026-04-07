import { loadSustainabilityRows, type SustainabilityRow } from '@/lib/sustainabilityLocalData';

function latestRowByZone(rows: SustainabilityRow[]): Map<string, SustainabilityRow> {
  const m = new Map<string, SustainabilityRow>();
  for (const r of rows) {
    const prev = m.get(r.zone);
    if (!prev || r.year > prev.year) m.set(r.zone, r);
  }
  return m;
}

function round(n: number, d: number) {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

/** Mirrors sustainability_api simulation_router stress_test when CSV-backed. */
export async function getLocalStressTestResponse(body: {
  population_growth_rate?: number;
  temp_rise_per_year?: number;
  years?: number;
}) {
  const population_growth_rate = body.population_growth_rate ?? 0.025;
  const temp_rise_per_year = body.temp_rise_per_year ?? 0.05;
  const years = body.years ?? 15;

  const rows = await loadSustainabilityRows();
  const byZone = latestRowByZone(rows);
  const results: Array<{
    zone: string;
    water_crisis_year: number | null;
    waste_crisis_year: number | null;
    overall_risk: string;
  }> = [];

  for (const [zone, row] of byZone) {
    const base_demand = row.water_demand_mgd || 300;
    const base_supply = row.water_supply_mgd || 280;
    const base_waste = row.waste_generated_tpd || 1200;
    const base_waste_cap = row.waste_processed_tpd || 700;

    let water_crisis_year: number | null = null;
    let waste_crisis_year: number | null = null;

    for (let i = 0; i < years; i += 1) {
      const year = 2025 + i;
      const factor = (1 + population_growth_rate) ** i;
      const demand = base_demand * factor;
      const supply = base_supply * (1 + 0.005 * i);
      const waste_gen = base_waste * factor;
      const waste_proc = base_waste_cap * (1 + 0.01 * i);

      if (demand > supply * 1.25 && water_crisis_year === null) {
        water_crisis_year = year;
      }
      if (waste_gen > waste_proc * 1.5 && waste_crisis_year === null) {
        waste_crisis_year = year;
      }
    }

    const overall_risk =
      water_crisis_year && water_crisis_year < 2030
        ? 'Critical'
        : water_crisis_year
          ? 'High'
          : 'Moderate';

    results.push({ zone, water_crisis_year, waste_crisis_year, overall_risk });
  }

  results.sort((a, b) => (a.water_crisis_year ?? 9999) - (b.water_crisis_year ?? 9999));

  return {
    growth_rate: population_growth_rate,
    temp_rise_per_year,
    zones: results,
  };
}

/**
 * Minimal scenario comparison for the Policy Twin chart (Baseline vs Live Policy).
 */
export async function getLocalScenarioCompare(body: {
  scenarios?: Array<{ label: string; interventions: Record<string, number> }>;
  start_year?: number;
  end_year?: number;
}) {
  const rows = await loadSustainabilityRows();
  const byZone = latestRowByZone(rows);
  let sumScore = 0;
  let sumGhg = 0;
  let n = 0;
  for (const r of byZone.values()) {
    sumScore += r.sustainability_score;
    sumGhg += r.ghg_emissions_mtco2;
    n += 1;
  }
  const baseAvg = n ? sumScore / n : 55;
  const baseGhg = n ? sumGhg : 40;

  const start = body.start_year ?? 2025;
  const end = body.end_year ?? 2035;
  const liveScenario = body.scenarios?.find((s) => s.label === 'Live Policy') ?? body.scenarios?.[0];
  const ints = liveScenario?.interventions ?? {};
  const policySum =
    (ints.solar_increase ?? 0) +
    (ints.waste_improvement ?? 0) +
    (ints.green_expansion ?? 0) +
    (ints.water_conservation ?? 0) +
    (ints.ev_adoption ?? 0) +
    (ints.public_transport ?? 0);

  const span = Math.max(1, end - start);
  const city_timeseries: Array<{ label: string; year: number; avg_score: number; total_ghg: number }> = [];

  for (let y = start; y <= end; y += 1) {
    const t = y - start;
    const progress = t / span;
    const stressDrag = 0.12 * progress;
    const baselineScore = Math.max(28, baseAvg - stressDrag * 10);
    const policyLift = Math.min(22, policySum * 14 * progress);
    const liveScore = Math.min(96, baselineScore + policyLift);
    const baselineGhg = Math.max(4, baseGhg * (1 + 0.015 * t));
    const liveGhg = Math.max(3, baselineGhg * (1 - Math.min(0.45, policySum * 0.12 * progress)));

    city_timeseries.push({
      label: 'Baseline',
      year: y,
      avg_score: round(baselineScore, 2),
      total_ghg: round(baselineGhg, 2),
    });
    city_timeseries.push({
      label: 'Live Policy',
      year: y,
      avg_score: round(liveScore, 2),
      total_ghg: round(liveGhg, 2),
    });
  }

  return {
    scenarios: [
      { label: 'Baseline', interventions: {}, simulation: {} },
      {
        label: 'Live Policy',
        interventions: liveScenario?.interventions ?? {},
        simulation: {},
      },
    ],
    city_timeseries,
  };
}

/** SHAP-style waterfall from latest zone row when ML service is offline. */
export async function getLocalMlExplain(zone: string, year: number) {
  const rows = await loadSustainabilityRows();
  const zoneRows = rows.filter((r) => r.zone === zone).sort((a, b) => b.year - a.year);
  const row = zoneRows.find((r) => r.year === year) ?? zoneRows[0];
  if (!row) {
    throw new Error(`No CSV row for zone ${zone}`);
  }

  const demand = Math.max(1, row.water_demand_mgd);
  const ws = (row.water_demand_mgd - row.water_supply_mgd) / demand;
  const shap_values: Record<string, number> = {
    water_stress_index: round(ws * 6, 4),
    renewable_share_percent: round(row.renewable_share_percent * 0.06, 4),
    ghg_emissions_mtco2: round(-row.ghg_emissions_mtco2 * 0.12, 4),
    population: round(row.population * 1e-7, 4),
    energy_consumption_mu: round(-row.energy_consumption_mu * 8e-5, 4),
    waste_generated_tpd: round(-row.waste_generated_tpd * 0.0004, 4),
  };

  const waterfall = Object.entries(shap_values)
    .map(([feature, shap_value]) => ({
      feature,
      shap_value,
      direction: shap_value >= 0 ? ('positive' as const) : ('negative' as const),
      abs_value: Math.abs(shap_value),
    }))
    .sort((a, b) => b.abs_value - a.abs_value);

  const prediction = round(row.sustainability_score, 2);

  return {
    zone,
    year: row.year,
    prediction,
    base_value: 50,
    shap_values,
    top_positive_drivers: waterfall.filter((w) => w.shap_value > 0).slice(0, 4).map((w) => ({
      feature: w.feature,
      shap: w.shap_value,
      direction: 'positive',
    })),
    top_negative_drivers: waterfall.filter((w) => w.shap_value < 0).slice(0, 4).map((w) => ({
      feature: w.feature,
      shap: w.shap_value,
      direction: 'negative',
    })),
    waterfall,
  };
}
