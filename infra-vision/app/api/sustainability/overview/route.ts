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
    headers.forEach((h, i) => {
      const val = v[i];
      row[h] = isNaN(Number(val)) ? val : Number(val);
    });
    return row;
  });
}

export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get('year') || '2022');
  const data = loadData();
  if (!data.length) return NextResponse.json({ error: 'No data' }, { status: 404 });
  const filtered = data.filter((r: any) => r.year === year);
  const d = filtered.length ? filtered : data.filter((r: any) => r.year === Math.max(...data.map((x: any) => x.year)));
  const totals = d.reduce(
    (acc: any, r: any) => ({
      water_supply: acc.water_supply + (r.water_supply_mgd || 0),
      water_demand: acc.water_demand + (r.water_demand_mgd || 0),
      energy: acc.energy + (r.energy_consumption_mu || 0),
      solar: acc.solar + (r.solar_capacity_mw || 0),
      waste_gen: acc.waste_gen + (r.waste_generated_tpd || 0),
      waste_proc: acc.waste_proc + (r.waste_processed_tpd || 0),
      ghg: acc.ghg + (r.ghg_emissions_mtco2 || 0),
      green: acc.green + (r.green_space_sqkm || 0),
      pop: acc.pop + (r.population || 0),
    }),
    { water_supply: 0, water_demand: 0, energy: 0, solar: 0, waste_gen: 0, waste_proc: 0, ghg: 0, green: 0, pop: 0 }
  );
  const water_gap = Math.max(0, totals.water_demand - totals.water_supply);
  const renewable = totals.energy > 0 ? (totals.solar * 0.4 * 365 / 1000) / (totals.energy / 1000) * 100 : 0;
  const waste_rate = totals.waste_gen > 0 ? (totals.waste_proc / totals.waste_gen) * 100 : 0;
  const green_sqm = totals.pop > 0 ? (totals.green * 1e6) / totals.pop : 0;
  const avgScore = d.length ? d.reduce((s: number, r: any) => s + (r.sustainability_score || 0), 0) / d.length : 0;
  return NextResponse.json({
    year,
    water_gap_mgd: Math.round(water_gap * 10) / 10,
    renewable_share_percent: Math.min(100, Math.round(renewable * 10) / 10),
    waste_processing_rate: Math.round(waste_rate * 10) / 10,
    green_space_sqm_per_capita: Math.round(green_sqm * 100) / 100,
    ghg_emissions_mtco2: Math.round(totals.ghg * 10) / 10,
    city_sustainability_score: Math.round(avgScore * 10) / 10,
    zone_data: d,
  });
}
