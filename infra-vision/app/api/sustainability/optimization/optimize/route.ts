import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await fetchBackendJson('/api/optimization/optimize', {
    method: 'POST',
    body: {
      budget_cr: body.budget_cr ?? 1500,
      target_ghg_reduction: body.target_ghg_reduction ?? 5,
      min_score_lift: body.min_score_lift ?? 10,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to optimize policy' }, { status: result.status });
  }

  return NextResponse.json(result.data ?? {});
}
