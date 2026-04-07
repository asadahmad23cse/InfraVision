import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalStressTestResponse } from '@/lib/policyTwinLocalData';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const payload = {
    population_growth_rate: body.population_growth_rate ?? 0.025,
    temp_rise_per_year: body.temp_rise_per_year ?? 0.05,
    years: body.years ?? 15,
  };
  const result = await fetchBackendJson('/api/simulation/stress', {
    method: 'POST',
    body: payload,
  });
  if (!result.ok) {
    const msg = result.error || 'Unable to run stress test';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = await getLocalStressTestResponse(payload);
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local stress test failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
