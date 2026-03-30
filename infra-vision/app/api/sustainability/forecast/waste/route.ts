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

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  const recyclingIncrease = parseFloat(req.nextUrl.searchParams.get('recycling_increase') || '20');
  if (!ZONES.includes(zone)) return NextResponse.json({ error: 'Invalid zone' }, { status: 400 });
  const data = loadData().filter((r: any) => r.zone === zone);
  const latest = data.filter((r: any) => r.year === Math.max(...data.map((x: any) => x.year)))[0];
  if (!latest) return NextResponse.json({ error: 'No data' }, { status: 404 });
  const wasteGen = Number(latest.waste_generated_tpd || 1);
  const wasteProc = Number(latest.waste_processed_tpd || 0);
  const landfillPct = Number(latest.landfill_dependency_percent || 50);
  const ceIndex = (wasteProc / wasteGen) * 100;
  const newCe = Math.min(100, ceIndex + recyclingIncrease);
  const landfillReduction = wasteGen * (landfillPct / 100) * (recyclingIncrease / 100);
  const ghgSavings = landfillReduction * 0.0005;
  return NextResponse.json({
    zone,
    recycling_increase: recyclingIncrease,
    current_ce_index: Math.round(ceIndex * 10) / 10,
    projected_ce_index: Math.round(newCe * 10) / 10,
    landfill_reduction_tpd: Math.round(landfillReduction * 10) / 10,
    ghg_savings_mtco2: Math.round(ghgSavings * 100) / 100,
    years_to_achieve: Math.max(3, Math.ceil(recyclingIncrease / 5)),
  });
}
