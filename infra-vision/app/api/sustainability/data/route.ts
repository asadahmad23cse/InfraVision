import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

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
    return NextResponse.json({ error: result.error || 'Unable to load sustainability data' }, { status: result.status });
  }

  return NextResponse.json(result.data ?? { data: [] });
}
