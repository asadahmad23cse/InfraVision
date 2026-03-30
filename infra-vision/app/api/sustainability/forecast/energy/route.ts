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
  const renewableTarget = parseFloat(req.nextUrl.searchParams.get('renewable_target') || '25');
  if (!ZONES.includes(zone)) return NextResponse.json({ error: 'Invalid zone' }, { status: 400 });
  const data = loadData().filter((r: any) => r.zone === zone);
  const latest = data.filter((r: any) => r.year === Math.max(...data.map((x: any) => x.year)))[0];
  if (!latest) return NextResponse.json({ error: 'No data' }, { status: 404 });
  const energyMu = Number(latest.energy_consumption_mu || 0);
  const currSolar = Number(latest.solar_capacity_mw || 0);
  const currRenewable = Number(latest.renewable_share_percent || 0);
  const solarPerPct = currRenewable > 0 ? currSolar / currRenewable : 100;
  const mwNeeded = Math.max(0, (renewableTarget - currRenewable) * solarPerPct);
  const ghgReduction = energyMu * ((renewableTarget - currRenewable) / 100) * 0.5;
  const costCr = mwNeeded * 0.5;
  return NextResponse.json({
    zone,
    renewable_target: renewableTarget,
    solar_mw_needed: Math.round(mwNeeded * 10) / 10,
    ghg_reduction_mtco2: Math.round(ghgReduction * 10) / 10,
    cost_estimate_cr: Math.round(costCr),
    years_to_achieve: Math.max(2, Math.ceil(mwNeeded / 20)),
  });
}
