import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await fetchBackendJson('/api/simulation/compare', {
    method: 'POST',
    body: {
      scenarios: body.scenarios ?? [],
      start_year: body.start_year ?? 2025,
      end_year: body.end_year ?? 2035,
    },
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to compare scenarios' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
