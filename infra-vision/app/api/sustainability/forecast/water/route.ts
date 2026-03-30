import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ZONES = ['North', 'South', 'East', 'West', 'Central', 'North-East', 'North-West', 'South-West', 'South-East'];

function loadData() {
  const p = path.join(process.cwd(), 'public', 'data', 'expanded_sustainability_delhi.csv');
  if (!fs.existsSync(p)) return [];
  const csv = fs.readFileSync(p, 'utf-8');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const v = line.split(',');
    const row: Record<string, number | string> = {};
    headers.forEach((h, i) => { row[h] = isNaN(Number(v[i])) ? v[i] : Number(v[i]); });
    return row;
  });
}

function linearForecast(years: number[], values: number[], target: number): number {
  if (years.length < 2) return values[values.length - 1] ?? 0;
  const n = years.length;
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = years.reduce((s, x, i) => s + x * values[i], 0);
  const sumXX = years.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return Math.max(0, slope * target + intercept);
}

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  const targetYear = parseInt(req.nextUrl.searchParams.get('target_year') || '2030');
  if (!ZONES.includes(zone)) return NextResponse.json({ error: 'Invalid zone' }, { status: 400 });
  const data = loadData().filter((r: any) => r.zone === zone).sort((a: any, b: any) => a.year - b.year);
  if (!data.length) return NextResponse.json({ error: 'No data' }, { status: 404 });
  const years = data.map((r: any) => r.year);
  const demand = data.map((r: any) => r.water_demand_mgd);
  const supply = data.map((r: any) => r.water_supply_mgd);
  const predDemand = linearForecast(years, demand, targetYear);
  const predSupply = linearForecast(years, supply, targetYear);
  const gapPct = predDemand > 0 ? ((predDemand - predSupply) / predDemand) * 100 : 0;
  let level = 'safe';
  if (gapPct >= 30) level = 'critical';
  else if (gapPct >= 15) level = 'high';
  else if (gapPct >= 5) level = 'moderate';
  const alert = (level === 'critical' || level === 'high') ? `${zone} will face ${level} water shortage by ${targetYear} at current growth rate` : null;
  return NextResponse.json({
    zone,
    target_year: targetYear,
    demand_forecast_mgd: Math.round(predDemand * 10) / 10,
    supply_forecast_mgd: Math.round(predSupply * 10) / 10,
    gap_percent: Math.round(gapPct * 10) / 10,
    stress_level: level,
    alert,
  });
}
