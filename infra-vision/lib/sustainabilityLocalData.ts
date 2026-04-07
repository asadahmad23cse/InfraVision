import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';
import { toNumber } from '@/lib/sustainabilityBackend';

export interface SustainabilityRow {
  zone: string;
  year: number;
  population: number;
  water_supply_mgd: number;
  water_demand_mgd: number;
  groundwater_extraction_mgd: number;
  groundwater_recharge_mgd: number;
  energy_consumption_mu: number;
  solar_capacity_mw: number;
  renewable_share_percent: number;
  waste_generated_tpd: number;
  waste_processed_tpd: number;
  landfill_dependency_percent: number;
  green_space_sqkm: number;
  tree_cover_percent: number;
  built_up_density_percent: number;
  ghg_emissions_mtco2: number;
  transport_emissions_mtco2: number;
  waste_emissions_mtco2: number;
  sustainability_score: number;
}

export interface OverviewResponse {
  year: number;
  water_gap_mgd: number;
  renewable_share_percent: number;
  waste_processing_rate: number;
  green_space_sqm_per_capita: number;
  ghg_emissions_mtco2: number;
  city_sustainability_score: number;
  zone_data: SustainabilityRow[];
}

let cachedRows: SustainabilityRow[] | null = null;
let loading: Promise<SustainabilityRow[]> | null = null;

function csvPath() {
  return path.join(process.cwd(), 'public', 'data', 'expanded_sustainability_delhi.csv');
}

function normalizeRow(raw: Record<string, unknown>): SustainabilityRow {
  return {
    zone: String(raw.zone ?? raw.Zone ?? '').trim() || 'Unknown',
    year: toNumber(raw.year ?? raw.Year, 0),
    population: toNumber(raw.population ?? raw.Population, 0),
    water_supply_mgd: toNumber(raw.water_supply_mgd, 0),
    water_demand_mgd: toNumber(raw.water_demand_mgd, 0),
    groundwater_extraction_mgd: toNumber(raw.groundwater_extraction_mgd, 0),
    groundwater_recharge_mgd: toNumber(raw.groundwater_recharge_mgd, 0),
    energy_consumption_mu: toNumber(raw.energy_consumption_mu, 0),
    solar_capacity_mw: toNumber(raw.solar_capacity_mw, 0),
    renewable_share_percent: toNumber(raw.renewable_share_percent, 0),
    waste_generated_tpd: toNumber(raw.waste_generated_tpd, 0),
    waste_processed_tpd: toNumber(raw.waste_processed_tpd, 0),
    landfill_dependency_percent: toNumber(raw.landfill_dependency_percent, 0),
    green_space_sqkm: toNumber(raw.green_space_sqkm, 0),
    tree_cover_percent: toNumber(raw.tree_cover_percent, 0),
    built_up_density_percent: toNumber(raw.built_up_density_percent, 0),
    ghg_emissions_mtco2: toNumber(raw.ghg_emissions_mtco2, 0),
    transport_emissions_mtco2: toNumber(raw.transport_emissions_mtco2, 0),
    waste_emissions_mtco2: toNumber(raw.waste_emissions_mtco2, 0),
    sustainability_score: toNumber(raw.sustainability_score, 0),
  };
}

export async function loadSustainabilityRows(): Promise<SustainabilityRow[]> {
  if (cachedRows) return cachedRows;
  if (loading) return loading;

  loading = (async () => {
    const text = await readFile(csvPath(), 'utf8');
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    const rows = (parsed.data || [])
      .map((r) => normalizeRow(r))
      .filter((r) => r.zone && r.year);

    cachedRows = rows;
    loading = null;
    return rows;
  })().catch((err) => {
    loading = null;
    throw err;
  });

  return loading;
}

export async function getZonesLocal(): Promise<string[]> {
  const rows = await loadSustainabilityRows();
  return Array.from(new Set(rows.map((r) => r.zone))).sort((a, b) => a.localeCompare(b));
}

export async function getFullDataLocal(zone?: string, year?: number): Promise<SustainabilityRow[]> {
  const rows = await loadSustainabilityRows();
  return rows.filter((r) => {
    if (zone && r.zone !== zone) return false;
    if (year && r.year !== year) return false;
    return true;
  });
}

export async function getOverviewLocal(year: number): Promise<OverviewResponse> {
  const zoneData = await getFullDataLocal(undefined, year);

  const totals = zoneData.reduce(
    (acc, r) => {
      acc.population += r.population || 0;
      acc.water_gap += Math.max(0, (r.water_demand_mgd || 0) - (r.water_supply_mgd || 0));
      acc.energy += r.energy_consumption_mu || 0;
      acc.renewable_weighted += (r.renewable_share_percent || 0) * (r.energy_consumption_mu || 0);
      acc.waste_gen += r.waste_generated_tpd || 0;
      acc.waste_proc += r.waste_processed_tpd || 0;
      acc.green_sqkm += r.green_space_sqkm || 0;
      acc.ghg += r.ghg_emissions_mtco2 || 0;
      acc.score_sum += r.sustainability_score || 0;
      acc.count += 1;
      return acc;
    },
    {
      population: 0,
      water_gap: 0,
      energy: 0,
      renewable_weighted: 0,
      waste_gen: 0,
      waste_proc: 0,
      green_sqkm: 0,
      ghg: 0,
      score_sum: 0,
      count: 0,
    },
  );

  const renewable_share_percent = totals.energy > 0 ? totals.renewable_weighted / totals.energy : 0;
  const waste_processing_rate = totals.waste_gen > 0 ? (totals.waste_proc / totals.waste_gen) * 100 : 0;
  const green_space_sqm_per_capita = totals.population > 0 ? (totals.green_sqkm * 1_000_000) / totals.population : 0;
  const city_sustainability_score = totals.count ? totals.score_sum / totals.count : 0;

  return {
    year,
    water_gap_mgd: totals.water_gap,
    renewable_share_percent: Number(renewable_share_percent.toFixed(2)),
    waste_processing_rate: Number(waste_processing_rate.toFixed(2)),
    green_space_sqm_per_capita: Number(green_space_sqm_per_capita.toFixed(2)),
    ghg_emissions_mtco2: Number(totals.ghg.toFixed(2)),
    city_sustainability_score: Number(city_sustainability_score.toFixed(2)),
    zone_data: zoneData,
  };
}

