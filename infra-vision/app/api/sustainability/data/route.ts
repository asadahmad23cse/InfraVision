import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getFullDataLocal } from '@/lib/sustainabilityLocalData';

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  const year = req.nextUrl.searchParams.get('year') || '';
  const result = await fetchBackendJson('/data/full', {
    query: {
      zone: zone || undefined,
      year: year || undefined,
    },
  });

  if (!result.ok) {
    const msg = result.error || 'Unable to load sustainability data';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const yearNum = year ? Number(year) : undefined;
        const data = await getFullDataLocal(zone || undefined, Number.isFinite(yearNum as number) ? (yearNum as number) : undefined);
        return NextResponse.json({ data });
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Failed to load local sustainability data';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }

  return NextResponse.json(result.data ?? { data: [] });
}
