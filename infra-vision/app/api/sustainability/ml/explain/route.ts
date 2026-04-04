import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

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
    return NextResponse.json({ error: result.error || 'Unable to load ML explainability' }, { status: result.status });
  }

  return NextResponse.json(result.data ?? {});
}
