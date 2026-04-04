import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }
  const result = await fetchBackendJson(`/api/recommendation/zone/${encodeURIComponent(zone)}`);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to load recommendations' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
