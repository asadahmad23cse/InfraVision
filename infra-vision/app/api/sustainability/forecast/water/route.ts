import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson, toNumber } from '@/lib/sustainabilityBackend';
import { getFullDataLocal } from '@/lib/sustainabilityLocalData';

interface WaterPrediction {
  year?: number;
  demand_forecast?: number;
  lower?: number;
  upper?: number;
}

interface WaterForecastResponse {
  predictions?: WaterPrediction[];
}

interface FullDataResponse {
  data?: Array<Record<string, unknown>>;
}

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  const targetYear = parseInt(req.nextUrl.searchParams.get('target_year') || '2030');
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }

  const [forecastRes, dataRes] = await Promise.all([
    fetchBackendJson<WaterForecastResponse>('/api/ml/forecast/water', {
      query: { zone, start_year: targetYear, end_year: targetYear },
    }),
    fetchBackendJson<FullDataResponse>('/data/full', { query: { zone } }),
  ]);

  const errMsg = forecastRes.ok ? '' : (forecastRes.error || '');
  const errMsg2 = dataRes.ok ? '' : (dataRes.error || '');
  const backendUnavailable =
    (!forecastRes.ok && (forecastRes.status === 502 || /fetch failed|ECONNREFUSED|connect/i.test(errMsg))) ||
    (!dataRes.ok && (dataRes.status === 502 || /fetch failed|ECONNREFUSED|connect/i.test(errMsg2)));

  if (!forecastRes.ok || !dataRes.ok) {
    if (!backendUnavailable) {
      if (!forecastRes.ok) {
        return NextResponse.json({ error: forecastRes.error || 'Unable to load water forecast' }, { status: forecastRes.status });
      }
      return NextResponse.json({ error: dataRes.error || 'Unable to load water baseline data' }, { status: dataRes.status });
    }
  }

  const rows = backendUnavailable
    ? (await getFullDataLocal(zone)).slice().sort((a, b) => toNumber(a.year) - toNumber(b.year))
    : (dataRes.data?.data || []).slice().sort((a, b) => toNumber(a.year) - toNumber(b.year));

  const latest = (rows[rows.length - 1] || {}) as Record<string, unknown>;
  const latestYear = toNumber(latest.year, 2022);
  const latestSupply = toNumber(latest.water_supply_mgd);
  const baselineDemand = toNumber(latest.water_demand_mgd);

  const prediction = (forecastRes.ok ? (forecastRes.data?.predictions || []) : [])[0] || {};
  const annualDemandGrowth = 0.02;
  const demandForecast = backendUnavailable
    ? baselineDemand * Math.pow(1 + annualDemandGrowth, Math.max(0, targetYear - latestYear))
    : toNumber(prediction.demand_forecast, baselineDemand);
  const annualSupplyGrowth = 0.006;
  const supplyForecast = latestSupply * Math.pow(1 + annualSupplyGrowth, Math.max(0, targetYear - latestYear));
  const gapPct = demandForecast > 0 ? ((demandForecast - supplyForecast) / demandForecast) * 100 : 0;

  let level = 'safe';
  if (gapPct >= 30) level = 'critical';
  else if (gapPct >= 15) level = 'high';
  else if (gapPct >= 5) level = 'moderate';
  const alert = (level === 'critical' || level === 'high')
    ? `${zone} will face ${level} water shortage by ${targetYear} at current growth rate`
    : null;

  return NextResponse.json({
    zone,
    target_year: targetYear,
    demand_forecast_mgd: Math.round(demandForecast * 10) / 10,
    supply_forecast_mgd: Math.round(supplyForecast * 10) / 10,
    gap_percent: Math.round(gapPct * 10) / 10,
    stress_level: level,
    alert,
  });
}
