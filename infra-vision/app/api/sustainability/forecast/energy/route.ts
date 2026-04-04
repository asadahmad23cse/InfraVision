import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson, toNumber } from '@/lib/sustainabilityBackend';

interface EnergyPrediction {
  year?: number;
  energy_forecast_mu?: number;
  solar_capacity_mw?: number;
  renewable_share_pct?: number;
}

interface EnergyForecastResponse {
  predictions?: EnergyPrediction[];
}

interface FullDataResponse {
  data?: Array<Record<string, unknown>>;
}

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  const renewableTarget = parseFloat(req.nextUrl.searchParams.get('renewable_target') || '25');
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }

  const targetYear = 2030;
  const [forecastRes, dataRes] = await Promise.all([
    fetchBackendJson<EnergyForecastResponse>('/api/ml/forecast/energy', {
      query: { zone, start_year: targetYear, end_year: targetYear },
    }),
    fetchBackendJson<FullDataResponse>('/data/full', { query: { zone } }),
  ]);

  if (!forecastRes.ok) {
    return NextResponse.json({ error: forecastRes.error || 'Unable to load energy forecast' }, { status: forecastRes.status });
  }
  if (!dataRes.ok) {
    return NextResponse.json({ error: dataRes.error || 'Unable to load energy baseline data' }, { status: dataRes.status });
  }

  const baselineRows = (dataRes.data?.data || []).slice().sort((a, b) => toNumber(a.year) - toNumber(b.year));
  const latest = (baselineRows[baselineRows.length - 1] || {}) as Record<string, unknown>;
  const currentRenewable = toNumber(latest.renewable_share_percent);
  const currentSolar = toNumber(latest.solar_capacity_mw);

  const prediction = (forecastRes.data?.predictions || [])[0] || {};
  const forecastEnergyMu = toNumber(prediction.energy_forecast_mu, toNumber(latest.energy_consumption_mu));
  const predictedSolar = toNumber(prediction.solar_capacity_mw, currentSolar);
  const predictedRenewable = toNumber(prediction.renewable_share_pct, currentRenewable);

  const denominatorShare = predictedRenewable > 0 ? predictedRenewable : currentRenewable;
  const solarPerPct = denominatorShare > 0 ? predictedSolar / denominatorShare : 20;
  const requiredDelta = Math.max(0, renewableTarget - currentRenewable);
  const mwNeeded = requiredDelta * solarPerPct;
  const ghgReduction = forecastEnergyMu * (requiredDelta / 100) * 0.5;
  const costCr = mwNeeded * 0.45;

  return NextResponse.json({
    zone,
    renewable_target: renewableTarget,
    solar_mw_needed: Math.round(mwNeeded * 10) / 10,
    ghg_reduction_mtco2: Math.round(ghgReduction * 10) / 10,
    cost_estimate_cr: Math.round(costCr * 10) / 10,
    years_to_achieve: Math.max(1, Math.ceil(mwNeeded / 35)),
  });
}
