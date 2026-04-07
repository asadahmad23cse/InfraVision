import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') || 50);
  const result = await fetchBackendJson('/api/alerts/history', {
    query: { limit: Number.isFinite(limit) ? limit : 50 },
  });

  if (!result.ok) {
    const msg = result.error || 'Unable to load alerts history';
    const backendUnavailable =
      result.status === 502 ||
      /fetch failed|ECONNREFUSED|connect/i.test(msg);
    if (backendUnavailable) {
      return NextResponse.json({ alerts: [] });
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }

  return NextResponse.json(result.data ?? { alerts: [] });
}
