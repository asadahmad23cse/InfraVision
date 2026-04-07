import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getZonesLocal } from '@/lib/sustainabilityLocalData';

export async function GET() {
  const result = await fetchBackendJson('/data/zones');
  if (!result.ok) {
    const msg = result.error || 'Unable to load zones';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const zones = await getZonesLocal();
        return NextResponse.json({ zones });
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Failed to load local zones';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }
  return NextResponse.json(result.data ?? { zones: [] });
}
