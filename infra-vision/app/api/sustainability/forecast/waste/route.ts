import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson, toNumber } from '@/lib/sustainabilityBackend';

interface WastePrediction {
  ce_index?: number;
  waste_generation_tpd?: number;
  landfill_dependency_percent?: number;
}

interface WasteForecastResponse {
  predictions?: WastePrediction[];
}

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  const recyclingIncrease = parseFloat(req.nextUrl.searchParams.get('recycling_increase') || '20');
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }

  const targetYear = 2030;
  const forecastRes = await fetchBackendJson<WasteForecastResponse>('/api/ml/forecast/waste', {
    query: { zone, start_year: targetYear, end_year: targetYear },
  });
  if (!forecastRes.ok) {
    return NextResponse.json({ error: forecastRes.error || 'Unable to load waste forecast' }, { status: forecastRes.status });
  }

  const prediction = (forecastRes.data?.predictions || [])[0] || {};
  const wasteGen = toNumber(prediction.waste_generation_tpd, 1);
  const landfillPct = toNumber(prediction.landfill_dependency_percent, 50);
  const ceIndex = toNumber(prediction.ce_index);
  const newCe = Math.min(100, ceIndex + recyclingIncrease);
  const landfillReduction = wasteGen * (landfillPct / 100) * (recyclingIncrease / 100);
  const ghgSavings = landfillReduction * 0.0005;
  return NextResponse.json({
    zone,
    recycling_increase: recyclingIncrease,
    current_ce_index: Math.round(ceIndex * 10) / 10,
    projected_ce_index: Math.round(newCe * 10) / 10,
    landfill_reduction_tpd: Math.round(landfillReduction * 10) / 10,
    ghg_savings_mtco2: Math.round(ghgSavings * 100) / 100,
    years_to_achieve: Math.max(3, Math.ceil(recyclingIncrease / 5)),
  });
}
