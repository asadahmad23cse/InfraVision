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
  if (!ZONES.includes(zone)) return NextResponse.json({ error: 'Invalid zone' }, { status: 400 });
  const data = loadData().filter((r: any) => r.zone === zone);
  const latest = data.filter((r: any) => r.year === Math.max(...data.map((x: any) => x.year)))[0];
  if (!latest) return NextResponse.json({ error: 'No data' }, { status: 404 });
  const issues: any[] = [];
  if (Number(latest.water_demand_mgd || 0) > Number(latest.water_supply_mgd || 0) * 1.15) {
    issues.push({ risk: 'Water', urgency: 'Critical', action: 'Expand water supply / conservation programs', impact: 'Reduce water stress', cost_cr: 120, timeline_years: 3 });
  }
  if (Number(latest.landfill_dependency_percent || 0) > 50) {
    issues.push({ risk: 'Waste', urgency: 'High', action: 'Increase waste processing capacity', impact: 'Reduce landfill dependency', cost_cr: 80, timeline_years: 2 });
  }
  if (Number(latest.renewable_share_percent || 0) < 2) {
    issues.push({ risk: 'Energy', urgency: 'High', action: 'Deploy rooftop solar', impact: 'Reduce GHG emissions', cost_cr: 60, timeline_years: 2 });
  }
  if (Number(latest.green_space_sqkm || 0) < 10 && Number(latest.population || 0) > 2e6) {
    issues.push({ risk: 'Green', urgency: 'Medium', action: 'Create new parks / afforestation', impact: 'Reduce heat island risk', cost_cr: 40, timeline_years: 4 });
  }
  if (Number(latest.ghg_emissions_mtco2 || 0) > 6) {
    issues.push({ risk: 'Emissions', urgency: 'High', action: 'EV adoption + public transport', impact: 'Align with net-zero goals', cost_cr: 100, timeline_years: 5 });
  }
  const scoreAfter = Math.min(100, Number(latest.sustainability_score || 0) + issues.slice(0, 3).length * 15);
  return NextResponse.json({
    zone,
    biggest_risk: issues[0]?.risk || 'None',
    urgency: issues[0]?.urgency || 'Low',
    top_interventions: issues.slice(0, 3),
    current_score: Math.round(Number(latest.sustainability_score || 0) * 10) / 10,
    projected_score_if_actions_taken: Math.round(scoreAfter * 10) / 10,
  });
}
