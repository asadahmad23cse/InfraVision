import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalTwinGraphExport } from '@/lib/digitalTwinLocalGraph';

export async function GET() {
  const result = await fetchBackendJson('/api/simulation/graph');
  if (!result.ok) {
    const msg = result.error || 'Unable to load digital twin graph';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = await getLocalTwinGraphExport();
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local digital twin failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
