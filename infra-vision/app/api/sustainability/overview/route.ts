import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getOverviewLocal } from '@/lib/sustainabilityLocalData';

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get('year') || '2022');
  const result = await fetchBackendJson('/data/overview', { query: { year } });
  if (!result.ok) {
    const msg = result.error || 'Unable to load overview';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = await getOverviewLocal(year);
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Failed to load local sustainability data';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
