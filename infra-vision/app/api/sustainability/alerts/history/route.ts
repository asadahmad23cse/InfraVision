import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') || 50);
  const result = await fetchBackendJson('/api/alerts/history', {
    query: { limit: Number.isFinite(limit) ? limit : 50 },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to load alerts history' }, { status: result.status });
  }

  return NextResponse.json(result.data ?? { alerts: [] });
}
