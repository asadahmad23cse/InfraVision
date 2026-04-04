import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

const ALLOWED_CATEGORIES = new Set(['water', 'energy', 'waste', 'carbon']);

export async function GET(req: NextRequest, context: { params: Promise<{ category: string }> }) {
  const { category: rawCategory } = await context.params;
  const category = String(rawCategory || '').toLowerCase();
  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Invalid forecast category' }, { status: 400 });
  }

  const zone = req.nextUrl.searchParams.get('zone') || '';
  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }

  const startYear = Number(req.nextUrl.searchParams.get('start_year') || 2025);
  const endYear = Number(req.nextUrl.searchParams.get('end_year') || 2030);

  const result = await fetchBackendJson(`/api/ml/forecast/${category}`, {
    query: {
      zone,
      start_year: startYear,
      end_year: endYear,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to load forecast series' }, { status: result.status });
  }

  return NextResponse.json(result.data ?? {});
}
