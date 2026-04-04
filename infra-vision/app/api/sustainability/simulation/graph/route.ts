import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET() {
  const result = await fetchBackendJson('/api/simulation/graph');
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to load digital twin graph' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? {});
}
