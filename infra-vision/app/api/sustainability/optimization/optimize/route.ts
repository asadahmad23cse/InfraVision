import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';
import { getLocalOptimizationForUi } from '@/lib/optimizationLocalData';

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
    const msg = result.error || 'Unable to optimize policy';
    const backendUnavailable =
      result.status === 502 || /fetch failed|ECONNREFUSED|connect|aborted/i.test(msg);
    if (backendUnavailable) {
      try {
        const data = getLocalOptimizationForUi(
          Number(body.budget_cr) || 1500,
          Number(body.target_ghg_reduction) || 5,
          Number(body.min_score_lift) || 10,
        );
        return NextResponse.json(data);
      } catch (e) {
        const emsg = e instanceof Error ? e.message : 'Local optimization failed';
        return NextResponse.json({ error: emsg }, { status: 500 });
      }
    }
    return NextResponse.json({ error: msg }, { status: result.status });
  }

  return NextResponse.json(result.data ?? {});
}
