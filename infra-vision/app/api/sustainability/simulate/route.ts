import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const p = {
    solar_increase: Number(body.solar_increase ?? 0) / 100,
    waste_improvement: Number(body.waste_improvement ?? 0) / 100,
    green_expansion: Number(body.green_expansion ?? 0) / 100,
    water_conservation: Number(body.water_conservation ?? 0) / 100,
    ev_adoption: Number(body.ev_adoption ?? 0) / 100,
    public_transport: Number(body.public_transport ?? 0) / 100,
  };
  const data = loadData();
  const base = data.filter((r: any) => r.year === 2022);
  if (!base.length) return NextResponse.json({ error: 'No data' }, { status: 404 });
  const tot_ghg = base.reduce((s: number, r: any) => s + (r.ghg_emissions_mtco2 || 0), 0);
  const tot_demand = base.reduce((s: number, r: any) => s + (r.water_demand_mgd || 0), 0);
  const tot_landfill = base.reduce((s: number, r: any) => s + (r.waste_generated_tpd || 0) * ((r.landfill_dependency_percent || 0) / 100), 0);
  const ghg_reduction = tot_ghg * (p.solar_increase * 0.15 + p.waste_improvement * 0.1 + p.ev_adoption * 0.25 + p.public_transport * 0.2);
  const water_savings = tot_demand * (p.water_conservation * 0.25);
  const waste_diverted = tot_landfill * (p.waste_improvement * 0.5);
  const cost_cr = p.solar_increase * 500 + p.waste_improvement * 300 + p.green_expansion * 200 + p.water_conservation * 150 + p.ev_adoption * 400 + p.public_transport * 250;
  const score_delta = tot_ghg > 0 ? (ghg_reduction / tot_ghg * 15 + water_savings / tot_demand * 10 + (tot_landfill ? waste_diverted / tot_landfill * 10 : 0)) : 0;
  return NextResponse.json({
    ghg_reduction_mtco2: Math.round(ghg_reduction * 10) / 10,
    water_savings_mgd: Math.round(water_savings * 10) / 10,
    waste_diverted_tpd: Math.round(waste_diverted * 10) / 10,
    sustainability_score_delta: Math.round(Math.min(25, score_delta) * 10) / 10,
    cost_estimate_cr: Math.round(cost_cr),
    roi_score: Math.round((ghg_reduction + water_savings * 2 + waste_diverted) / Math.max(1, cost_cr) * 100) / 100,
  });
}
