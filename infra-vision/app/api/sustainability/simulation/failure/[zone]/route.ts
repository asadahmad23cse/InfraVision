import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalTwinFailureSimulation } from '@/lib/digitalTwinLocalGraph';

const VALID_ZONES = new Set([
  'North',
  'South',
  'East',
  'West',
  'Central',
  'North-East',
  'North-West',
  'South-West',
  'South-East',
]);

export async function GET(_: NextRequest, context: { params: Promise<{ zone: string }> }) {
  const { zone } = await context.params;
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }
  const decoded = decodeURIComponent(zone);
  if (!VALID_ZONES.has(decoded)) {
    return NextResponse.json({ error: 'Invalid zone' }, { status: 400 });
  }

  const result = await fetchBackendJson(`/api/simulation/failure/${encodeURIComponent(decoded)}`);
  if (!result.ok) {
    const msg = result.error || 'Unable to run failure simulation';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = await getLocalTwinFailureSimulation(decoded);
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local failure simulation failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
