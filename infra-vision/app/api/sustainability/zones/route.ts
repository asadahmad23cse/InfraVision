import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET() {
  const result = await fetchBackendJson('/data/zones');
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to load zones' }, { status: result.status });
  }
  return NextResponse.json(result.data ?? { zones: [] });
}
