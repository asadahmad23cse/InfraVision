import { NextResponse } from 'next/server';

const ZONES = ['North', 'South', 'East', 'West', 'Central', 'North-East', 'North-West', 'South-West', 'South-East'];

export async function GET() {
  return NextResponse.json({ zones: ZONES });
}
