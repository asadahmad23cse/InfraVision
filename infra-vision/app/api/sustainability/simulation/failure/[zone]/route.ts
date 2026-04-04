import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET(_: NextRequest, context: { params: Promise<{ zone: string }> }) {
  const { zone } = await context.params;
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }
  const result = await fetchBackendJson(`/api/simulation/failure/${encodeURIComponent(zone)}`);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to run failure simulation' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
