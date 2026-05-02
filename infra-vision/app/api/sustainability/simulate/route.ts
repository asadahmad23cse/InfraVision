import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson, toNumber } from '@/lib/sustainabilityBackend';
import { getLocalScenarioCompare } from '@/lib/policyTwinLocalData';

interface ScenarioCompareResponse {
  scenarios?: ScenarioResult[];
  city_timeseries?: Array<{
    label?: string;
    year?: number;
    avg_score?: number;
    total_ghg?: number;
  }>;
}

interface ScenarioResult {
  label?: string;
  simulation?: Record<string, Record<string, {
    water_stress_index?: number;
    waste_processed_pct?: number;
  }>>;
}

function clampPercent(value: unknown) {
  return Math.min(1, Math.max(0, toNumber(value) / 100));
}

function pickCityPoint(rows: Array<{ label?: string; year?: number; avg_score?: number; total_ghg?: number }>, label: string) {
  const candidates = rows.filter((row) => row.label === label).sort((a, b) => toNumber(a.year) - toNumber(b.year));
  return candidates[candidates.length - 1];
}

function scenarioAverages(scenario?: ScenarioResult) {
  if (!scenario?.simulation) {
    return { waterStress: 0, wasteProcessed: 0 };
  }
  const years = Object.keys(scenario.simulation).sort((a, b) => Number(a) - Number(b));
  const lastYear = years[years.length - 1];
  if (!lastYear) {
    return { waterStress: 0, wasteProcessed: 0 };
  }
  const zoneMap = scenario.simulation[lastYear] || {};
  const zoneRows = Object.values(zoneMap);
  if (!zoneRows.length) {
    return { waterStress: 0, wasteProcessed: 0 };
  }
  const waterStress = zoneRows.reduce((sum, row) => sum + toNumber(row.water_stress_index), 0) / zoneRows.length;
  const wasteProcessed = zoneRows.reduce((sum, row) => sum + toNumber(row.waste_processed_pct), 0) / zoneRows.length;
  return { waterStress, wasteProcessed };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const p = {
    solar_increase: clampPercent(body.solar_increase),
    waste_improvement: clampPercent(body.waste_improvement),
    green_expansion: clampPercent(body.green_expansion),
    water_conservation: clampPercent(body.water_conservation),
    ev_adoption: clampPercent(body.ev_adoption),
    public_transport: clampPercent(body.public_transport),
  };

  const compareBody = {
    scenarios: [{ label: 'Policy Mix', interventions: p }],
    start_year: 2025,
    end_year: 2030,
  };
  const compareRes = await fetchBackendJson<ScenarioCompareResponse>('/api/simulation/compare', {
    method: 'POST',
    body: compareBody,
  });
  let compareData: ScenarioCompareResponse | null = compareRes.ok && compareRes.data ? compareRes.data : null;
  if (!compareData) {
    const msg = compareRes.error || 'Unable to simulate policy impact';
    const backendUnavailable =
      (compareRes.status || 502) === 502 || /fetch failed|ECONNREFUSED|connect|aborted/i.test(msg);
    if (backendUnavailable) {
      try {
        compareData = (await getLocalScenarioCompare(compareBody)) as ScenarioCompareResponse;
      } catch {
        return NextResponse.json({ error: msg }, { status: compareRes.status || 502 });
      }
    } else {
      return NextResponse.json({ error: msg }, { status: compareRes.status || 502 });
    }
  }

  if (!compareData) {
    return NextResponse.json({ error: 'Unable to simulate policy impact' }, { status: 502 });
  }

  const citySeries = compareData.city_timeseries || [];
  const baselinePoint = pickCityPoint(citySeries, 'Baseline');
  const policyPoint = pickCityPoint(citySeries, 'Policy Mix');

  const scenarios = compareData.scenarios || [];
  const baselineScenario = scenarios.find((s) => s.label === 'Baseline');
  const policyScenario = scenarios.find((s) => s.label === 'Policy Mix');
  const baselineAvg = scenarioAverages(baselineScenario);
  const policyAvg = scenarioAverages(policyScenario);

  const ghgReduction = Math.max(0, toNumber(baselinePoint?.total_ghg) - toNumber(policyPoint?.total_ghg));
  const scoreDelta = Math.max(0, toNumber(policyPoint?.avg_score) - toNumber(baselinePoint?.avg_score));
  const waterSavings = Math.max(0, (baselineAvg.waterStress - policyAvg.waterStress) * 600);
  const wasteDiverted = Math.max(0, (policyAvg.wasteProcessed - baselineAvg.wasteProcessed) * 180);

  const costCr =
    p.solar_increase * 900 +
    p.waste_improvement * 520 +
    p.green_expansion * 380 +
    p.water_conservation * 300 +
    p.ev_adoption * 740 +
    p.public_transport * 560;

  const roiScore =
    (ghgReduction * 1.8 + waterSavings * 0.9 + wasteDiverted * 0.08 + scoreDelta * 10) /
    Math.max(1, costCr);

  return NextResponse.json({
    ghg_reduction_mtco2: Math.round(ghgReduction * 10) / 10,
    water_savings_mgd: Math.round(waterSavings * 10) / 10,
    waste_diverted_tpd: Math.round(wasteDiverted * 10) / 10,
    sustainability_score_delta: Math.round(scoreDelta * 10) / 10,
    cost_estimate_cr: Math.round(costCr * 10) / 10,
    roi_score: Math.round(roiScore * 100) / 100,
  });
}
