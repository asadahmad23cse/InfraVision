import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getFullDataLocal } from '@/lib/sustainabilityLocalData';

const ALLOWED_CATEGORIES = new Set(['water', 'energy', 'waste', 'carbon']);

export async function GET(req: NextRequest, context: { params: Promise<{ category: string }> }) {
  const { category: rawCategory } = await context.params;
  const category = String(rawCategory || '').toLowerCase();
  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Invalid forecast category' }, { status: 400 });
  }

  const zone = req.nextUrl.searchParams.get('zone') || '';
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }

  const startYear = Number(req.nextUrl.searchParams.get('start_year') || 2025);
  const endYear = Number(req.nextUrl.searchParams.get('end_year') || 2030);

  const result = await fetchBackendJson(`/api/ml/forecast/${category}`, {
    query: {
      zone,
      start_year: startYear,
      end_year: endYear,
    },
  });

  if (!result.ok) {
    const msg = result.error || 'Unable to load forecast series';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (!backendUnavailable) {
      return NextResponse.json({ error: msg }, { status: result.status });
    }

    // Local fallback: generate a simple extrapolated series from the bundled CSV.
    const rows = (await getFullDataLocal(zone))
      .slice()
      .sort((a, b) => Number(a.year) - Number(b.year));
    const latest = rows[rows.length - 1];
    const latestYear = latest?.year || 2022;

    const baseValue = (() => {
      if (!latest) return 0;
      switch (category) {
        case 'water':
          return Number(latest.water_demand_mgd || 0);
        case 'energy':
          return Number(latest.energy_consumption_mu || 0);
        case 'waste':
          return Number(latest.waste_generated_tpd || 0);
        case 'carbon':
          return Number(latest.ghg_emissions_mtco2 || 0);
        default:
          return 0;
      }
    })();

    const annualGrowth = (() => {
      switch (category) {
        case 'water':
          return 0.02;
        case 'energy':
          return 0.015;
        case 'waste':
          return 0.012;
        case 'carbon':
          return -0.006; // assume gradual decarbonization
        default:
          return 0.0;
      }
    })();

    const predictions = [];
    for (let y = startYear; y <= endYear; y += 1) {
      const t = Math.max(0, y - latestYear);
      const yhat = baseValue * Math.pow(1 + annualGrowth, t);
      const lower = yhat * 0.92;
      const upper = yhat * 1.08;

      if (category === 'water') {
        predictions.push({
          year: y,
          demand_forecast: Math.round(yhat * 10) / 10,
          yhat_lower: Math.round(lower * 10) / 10,
          yhat_upper: Math.round(upper * 10) / 10,
        });
      } else {
        predictions.push({
          year: y,
          value: Math.round(yhat * 10) / 10,
          yhat_lower: Math.round(lower * 10) / 10,
          yhat_upper: Math.round(upper * 10) / 10,
        });
      }
    }

    return NextResponse.json({ zone, start_year: startYear, end_year: endYear, predictions });
  }

  return NextResponse.json(result.data ?? {});
}
