import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/sustainabilityBackend';

type WeatherResponse = {
  temperature_c?: number;
  temp?: number;
  condition?: string;
  humidity?: number;
  city?: string;
  source?: string;
};

export async function GET() {
  const result = await fetchBackendJson<WeatherResponse>('/api/weather/delhi', { timeoutMs: 8000 });
  if (result.ok && result.data) {
    const data = result.data;
    return NextResponse.json({
      temperature_c: data.temperature_c ?? data.temp ?? 32,
      condition: data.condition ?? 'Clear',
      humidity: data.humidity,
      city: data.city ?? 'Delhi',
      source: data.source ?? 'backend',
      impact: 'High heat increasing energy load by 12%',
    });
  }

  return NextResponse.json({
    temperature_c: 32,
    condition: 'Clear',
    city: 'Delhi',
    source: 'local-fallback',
    impact: 'High heat increasing energy load by 12%',
  });
}
