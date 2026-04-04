import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

export async function GET(req: NextRequest) {
  const budgetCr = Number(req.nextUrl.searchParams.get('budget_cr') || 1500);
  const steps = Number(req.nextUrl.searchParams.get('steps') || 8);

  const result = await fetchBackendJson('/api/optimization/pareto', {
    query: {
      budget_cr: Number.isFinite(budgetCr) ? budgetCr : 1500,
      steps: Number.isFinite(steps) ? steps : 8,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to load pareto frontier' }, { status: result.status });
  }

  return NextResponse.json(result.data ?? { pareto_points: [] });
}
