import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalScenarioCompare } from '@/lib/policyTwinLocalData';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await fetchBackendJson('/api/simulation/compare', {
    method: 'POST',
    body: {
      scenarios: body.scenarios ?? [],
      start_year: body.start_year ?? 2025,
      end_year: body.end_year ?? 2035,
    },
  });
  if (!result.ok) {
    const msg = result.error || 'Unable to compare scenarios';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = await getLocalScenarioCompare({
          scenarios: body.scenarios ?? [],
          start_year: body.start_year ?? 2025,
          end_year: body.end_year ?? 2035,
        });
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local scenario compare failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
