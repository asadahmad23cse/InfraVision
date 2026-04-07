import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalParetoFrontier } from '@/lib/optimizationLocalData';

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
    const msg = result.error || 'Unable to load pareto frontier';
    const backendUnavailable =
      result.status === 502 || /fetch failed|ECONNREFUSED|connect|aborted/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = getLocalParetoFrontier(
          Number.isFinite(budgetCr) ? budgetCr : 1500,
          Number.isFinite(steps) ? steps : 8,
        );
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local pareto failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }

  return NextResponse.json(result.data ?? { pareto_points: [] });
}
