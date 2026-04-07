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
 * Full multi-scenario comparison — all selected scenarios simulated independently.
 * Returns city_timeseries with one row per (label × year) and simulation with zone data.
 */
export async function getLocalScenarioCompare(body: {
  scenarios?: Array<{ label: string; interventions: Record<string, number> }>;
  start_year?: number;
  end_year?: number;
}) {
  const rows = await loadSustainabilityRows();
  const byZone = latestRowByZone(rows);
  const zones = [...byZone.values()];

  const baseAvgScore = zones.length ? zones.reduce((s, z) => s + z.sustainability_score, 0) / zones.length : 55;
  const baseTotalGhg = zones.reduce((s, z) => s + z.ghg_emissions_mtco2, 0) || 40;
  const baseRenewable = zones.length ? zones.reduce((s, z) => s + z.renewable_share_percent, 0) / zones.length : 12;

  const start = body.start_year ?? 2025;
  const end = body.end_year ?? 2035;
  const span = Math.max(1, end - start);
  const scenariosIn = body.scenarios ?? [];

  // Always include baseline + all user-selected non-baseline scenarios
  const allScenarios: Array<{ label: string; interventions: Record<string, number> }> = [
    { label: 'Baseline', interventions: { solar_increase: 0, waste_improvement: 0, green_expansion: 0, water_conservation: 0, ev_adoption: 0, public_transport: 0 } },
    ...scenariosIn.filter(s => !/^baseline$/i.test((s.label ?? '').trim())),
  ];

  const city_timeseries: Array<{ label: string; year: number; avg_score: number; total_ghg: number; renewable_pct: number; waste_pct: number }> = [];
  const scenarioResults: Array<{ label: string; interventions: Record<string, number>; simulation: Record<string, Record<string, unknown>> }> = [];

  for (const scenario of allScenarios) {
    const ints = scenario.interventions;
    const intSum = Object.values(ints).reduce((a, b) => a + b, 0);
    const solarB  = ints.solar_increase ?? 0;
    const wasteB  = ints.waste_improvement ?? 0;
    const evB     = ints.ev_adoption ?? 0;
    const transitB = ints.public_transport ?? 0;
    const waterB  = ints.water_conservation ?? 0;

    const simYears: Record<string, Record<string, unknown>> = {};

    for (let y = start; y <= end; y++) {
      const t = y - start;
      const prog = t / span;

      const baseScore = Math.max(28, baseAvgScore - 0.12 * prog * 10);
      const avgScore  = round(Math.min(94, baseScore + Math.min(28, intSum * 3.5 * prog)), 2);

      const baseGhg  = baseTotalGhg * Math.pow(1.015, t);
      const ghgCut   = Math.min(0.55, (solarB * 0.18 + evB * 0.16 + transitB * 0.12 + wasteB * 0.06) * prog);
      const totalGhg = round(Math.max(3, baseGhg * (1 - ghgCut)), 2);

      const renewable = round(Math.min(60, baseRenewable + solarB * 22 * prog), 1);
      const wastePct  = round(Math.min(98, 65 + wasteB * 28 * prog), 1);

      city_timeseries.push({ label: scenario.label, year: y, avg_score: avgScore, total_ghg: totalGhg, renewable_pct: renewable, waste_pct: wastePct });

      const zoneData: Record<string, unknown> = {};
      for (const z of zones) {
        zoneData[z.zone] = {
          year: y, zone: z.zone,
          sustainability_score: round(Math.min(94, (z.sustainability_score || baseAvgScore) * (avgScore / baseAvgScore)), 2),
          ghg_emissions_mtco2: round(totalGhg / Math.max(1, zones.length), 2),
          renewable_share_percent: renewable,
          waste_processed_pct: wastePct,
          water_stress_index: round(Math.max(0, 0.25 - waterB * 0.15 * prog), 3),
        };
      }
      simYears[String(y)] = zoneData;
    }

    scenarioResults.push({ label: scenario.label, interventions: ints, simulation: simYears });
  }

  return { scenarios: scenarioResults, city_timeseries };
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
