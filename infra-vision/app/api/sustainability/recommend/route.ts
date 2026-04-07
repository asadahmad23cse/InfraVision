import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalZoneRecommendations } from '@/lib/recommendationLocalData';

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }
  const result = await fetchBackendJson(`/api/recommendation/zone/${encodeURIComponent(zone)}`);
  if (!result.ok) {
    const msg = result.error || 'Unable to load recommendations';
    const backendUnavailable =
      result.status === 502 || /fetch failed|ECONNREFUSED|connect|aborted/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = await getLocalZoneRecommendations(zone);
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local recommendations failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
