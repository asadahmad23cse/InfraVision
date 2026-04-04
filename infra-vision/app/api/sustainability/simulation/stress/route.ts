import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await fetchBackendJson('/api/simulation/stress', {
    method: 'POST',
    body: {
      population_growth_rate: body.population_growth_rate ?? 0.025,
      temp_rise_per_year: body.temp_rise_per_year ?? 0.05,
      years: body.years ?? 15,
    },
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to run stress test' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
