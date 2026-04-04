import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET(_: Request, { params }: { params: { zone: string } }) {
  const zone = params.zone;
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }
  const result = await fetchBackendJson(`/api/simulation/failure/${encodeURIComponent(zone)}`);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to run failure simulation' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
