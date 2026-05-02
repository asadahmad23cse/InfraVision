import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

const FALLBACK_PERFORMANCE = {
  metrics: [
    { model: 'Water', accuracy: 94, mae: 1.2, unit: 'MGD' },
    { model: 'Energy', accuracy: 91, mae: 0.8, unit: 'MU' },
    { model: 'Waste', accuracy: 90, mae: 12.7, unit: 'TPD' },
    { model: 'Carbon', accuracy: 88, mae: 5.4, unit: 'MTCO2' },
  ],
  validation_method: 'Time-series holdout validation with zone-level residual checks',
  confidence_score: 92,
};

export async function GET() {
  const result = await fetchBackendJson<typeof FALLBACK_PERFORMANCE>('/api/ml/performance', {
    timeoutMs: 8000,
  });

  if (result.ok && result.data) {
    return NextResponse.json(result.data);
  }

  return NextResponse.json({ ...FALLBACK_PERFORMANCE, source: 'local-fallback' });
}
