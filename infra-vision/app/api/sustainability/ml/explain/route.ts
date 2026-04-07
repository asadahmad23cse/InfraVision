import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalMlExplain } from '@/lib/policyTwinLocalData';

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }
  const year = Number(req.nextUrl.searchParams.get('year') || 2024);

  const result = await fetchBackendJson('/api/ml/explain', {
    query: {
      zone,
      year: Number.isFinite(year) ? year : 2024,
    },
  });

  if (!result.ok) {
    const msg = result.error || 'Unable to load ML explainability';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = await getLocalMlExplain(zone, Number.isFinite(year) ? year : 2024);
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local ML explain failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }

  return NextResponse.json(result.data ?? {});
}
