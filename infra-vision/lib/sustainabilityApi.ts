/**
 * Sustainability Intelligence API Client
 * Frontend calls Next.js API routes, which proxy to the FastAPI backend.
 */
const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE_URL || '';

function buildApiUrl(path: string) {
  const base = APP_BASE.replace(/\/+$/, '');
  return `${base}/api/sustainability${path}`;
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(path);
  const res = await fetch(url, { ...options, cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getOverview(year: number) {
  return fetchApi<OverviewResponse>(`/overview?year=${year}`);
}

export async function simulatePolicy(params: PolicyParams) {
  return fetchApi<PolicyResult>('/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export async function forecastWater(zone: string, targetYear = 2030) {
  return fetchApi<WaterForecast>(`/forecast/water?zone=${encodeURIComponent(zone)}&target_year=${targetYear}`);
}

export async function forecastEnergy(zone: string, renewableTarget = 25) {
  return fetchApi<EnergyForecast>(`/forecast/energy?zone=${encodeURIComponent(zone)}&renewable_target=${renewableTarget}`);
}

export async function forecastWaste(zone: string, recyclingIncrease = 20) {
  return fetchApi<WasteForecast>(`/forecast/waste?zone=${encodeURIComponent(zone)}&recycling_increase=${recyclingIncrease}`);
}

export async function getForecastSeries(
  category: 'water' | 'energy' | 'waste' | 'carbon',
  zone: string,
  startYear = 2025,
  endYear = 2030,
) {
  return fetchApi<ForecastSeriesResponse>(
    `/forecast/series/${category}?zone=${encodeURIComponent(zone)}&start_year=${startYear}&end_year=${endYear}`,
  );
}

export async function getZoneRecommendations(zone: string) {
  return fetchApi<ZoneRecommendations>(`/recommend?zone=${encodeURIComponent(zone)}`);
}

export async function getFullData(zone?: string, year?: number) {
  const q = new URLSearchParams();
  if (zone) q.set('zone', zone);
  if (year) q.set('year', String(year));
  return fetchApi<{ data: SustainabilityRow[] }>(`/data?${q}`);
}

export async function getZones() {
  return fetchApi<{ zones: string[] }>('/zones');
}

export async function getDigitalTwinGraph() {
  return fetchApi<TwinGraphResponse>('/simulation/graph');
}

export async function simulateDigitalTwinFailure(zone: string) {
  return fetchApi<TwinGraphResponse>(`/simulation/failure/${encodeURIComponent(zone)}`);
}

export async function runStressTest(params: StressTestRequest) {
  return fetchApi<StressTestResponse>('/simulation/stress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export async function compareScenarios(req: ScenarioCompareRequest) {
  return fetchApi<ScenarioCompareResponse>('/simulation/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
}

// Types
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

export interface PolicyParams {
  solar_increase: number;
  waste_improvement: number;
  green_expansion: number;
  water_conservation: number;
  ev_adoption: number;
  public_transport: number;
}

export interface PolicyResult {
  ghg_reduction_mtco2: number;
  water_savings_mgd: number;
  waste_diverted_tpd: number;
  sustainability_score_delta: number;
  cost_estimate_cr: number;
  roi_score: number;
}

export interface WaterForecast {
  zone: string;
  target_year: number;
  demand_forecast_mgd: number;
  supply_forecast_mgd: number;
  gap_percent: number;
  stress_level: string;
  alert: string | null;
}

export interface EnergyForecast {
  zone: string;
  renewable_target: number;
  solar_mw_needed: number;
  ghg_reduction_mtco2: number;
  cost_estimate_cr: number;
  years_to_achieve: number;
}

export interface WasteForecast {
  zone: string;
  recycling_increase: number;
  current_ce_index: number;
  projected_ce_index: number;
  landfill_reduction_tpd: number;
  ghg_savings_mtco2: number;
  years_to_achieve: number;
}

export interface ZoneRecommendations {
  zone: string;
  biggest_risk: string;
  urgency: string;
  top_interventions: Array<{
    risk: string;
    urgency: string;
    action: string;
    impact: string;
    cost_cr: number;
    timeline_years: number;
  }>;
  current_score: number;
  projected_score_if_actions_taken: number;
}

export interface TwinGraphNode {
  id: string;
  score?: number;
  status?: string;
  population?: number;
  water_stress?: number;
}

export interface TwinGraphResponse {
  nodes?: TwinGraphNode[];
  links?: Array<{
    source: string;
    target: string;
    type: string;
  }>;
  metrics?: Record<string, unknown>;
  network_resilience_pct?: number;
  directly_impacted?: Record<string, { impact_type?: string; reduction_percent?: number }>;
}

export interface StressTestRequest {
  population_growth_rate: number;
  temp_rise_per_year: number;
  years: number;
}

export interface StressTestResponse {
  growth_rate: number;
  temp_rise_per_year: number;
  zones: Array<{
    zone: string;
    water_crisis_year: number | null;
    waste_crisis_year: number | null;
    overall_risk: string;
  }>;
}

export interface ScenarioCompareRequest {
  scenarios: Array<{
    label: string;
    interventions: Record<string, number>;
  }>;
  start_year?: number;
  end_year?: number;
}

export interface ScenarioCompareResponse {
  scenarios: Array<{
    label: string;
    interventions: Record<string, number>;
    simulation: Record<string, Record<string, {
      year: number;
      zone: string;
      sustainability_score: number;
      water_stress_index: number;
      ghg_emissions_mtco2: number;
      renewable_share_percent: number;
      waste_processed_pct: number;
      green_sqm_per_capita: number;
    }>>;
  }>;
  city_timeseries: Array<{
    label: string;
    year: number;
    avg_score: number;
    total_ghg: number;
  }>;
}

export interface ForecastSeriesResponse {
  zone: string;
  model: string;
  predictions: Array<Record<string, number | string>>;
  feature_importance?: Record<string, number>;
}
