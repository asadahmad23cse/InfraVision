import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get('year') || '2022');
  const result = await fetchBackendJson('/data/overview', { query: { year } });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to load overview' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
