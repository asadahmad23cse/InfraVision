import { loadSustainabilityRows, type SustainabilityRow } from '@/lib/sustainabilityLocalData';

const ALL_ZONES = [
  'North',
  'South',
  'East',
  'West',
  'Central',
  'North-East',
  'North-West',
  'South-West',
  'South-East',
] as const;

const ZONE_EDGES: Array<{ src: string; dst: string; type: string; capacity: number }> = [
  { src: 'North', dst: 'North-West', type: 'water_pipeline', capacity: 380 },
  { src: 'North', dst: 'North-East', type: 'water_pipeline', capacity: 350 },
  { src: 'North', dst: 'Central', type: 'energy_grid', capacity: 2200 },
  { src: 'Central', dst: 'South', type: 'energy_grid', capacity: 2500 },
  { src: 'Central', dst: 'East', type: 'waste_transport', capacity: 800 },
  { src: 'Central', dst: 'West', type: 'waste_transport', capacity: 750 },
  { src: 'South', dst: 'South-East', type: 'water_pipeline', capacity: 300 },
  { src: 'South', dst: 'South-West', type: 'water_pipeline', capacity: 310 },
  { src: 'West', dst: 'North-West', type: 'energy_grid', capacity: 1900 },
  { src: 'East', dst: 'North-East', type: 'energy_grid', capacity: 1700 },
  { src: 'North-West', dst: 'South-West', type: 'waste_transport', capacity: 600 },
  { src: 'North-East', dst: 'South-East', type: 'water_pipeline', capacity: 290 },
];

function latestRowByZone(rows: SustainabilityRow[]): Map<string, SustainabilityRow> {
  const m = new Map<string, SustainabilityRow>();
  for (const r of rows) {
    const prev = m.get(r.zone);
    if (!prev || r.year > prev.year) m.set(r.zone, r);
  }
  return m;
}

function buildLinks(nodeIds: Set<string>) {
  const links: Array<{ source: string; target: string; type: string; capacity: number }> = [];
  for (const e of ZONE_EDGES) {
    if (!nodeIds.has(e.src) || !nodeIds.has(e.dst)) continue;
    links.push({ source: e.src, target: e.dst, type: e.type, capacity: e.capacity });
    links.push({
      source: e.dst,
      target: e.src,
      type: e.type,
      capacity: Math.round(e.capacity * 0.7),
    });
  }
  return links;
}

function nodeExport(zone: string, r: SustainabilityRow) {
  const ws = Math.max(0, r.water_demand_mgd - r.water_supply_mgd);
  return {
    id: zone,
    label: zone,
    score: Math.round(r.sustainability_score * 10) / 10,
    status: 'normal' as const,
    population: Math.round(r.population),
    water_stress: Math.round(ws * 10) / 10,
    energy_mu: Math.round(r.energy_consumption_mu * 10) / 10,
    ghg: Math.round(r.ghg_emissions_mtco2 * 100) / 100,
  };
}

export async function getLocalTwinGraphExport() {
  const rows = await loadSustainabilityRows();
  const byZone = latestRowByZone(rows);
  const nodes = [];
  const nodeIds = new Set<string>();

  for (const z of ALL_ZONES) {
    const r = byZone.get(z);
    if (!r) continue;
    nodeIds.add(z);
    nodes.push(nodeExport(z, r));
  }

  if (nodes.length === 0) {
    throw new Error('No zone rows in local sustainability CSV for digital twin');
  }

  const links = buildLinks(nodeIds);
  const degreeSum = links.filter((l) => nodeIds.has(l.source)).length;
  const avgDegree = nodes.length ? Math.round((degreeSum / nodes.length) * 100) / 100 : 0;

  return {
    nodes,
    links,
    metrics: {
      total_nodes: nodes.length,
      total_edges: links.length,
      avg_degree: avgDegree,
      is_connected: nodes.length > 1,
    },
  };
}

type LocalNode = Omit<ReturnType<typeof nodeExport>, 'status'> & {
  status: 'normal' | 'impacted' | 'failed';
};

/**
 * Flattened response for the UI: nodes/links at top level + failure fields
 * (FastAPI returns `{ graph: {...} }` but the page expects a flat merge).
 */
export async function getLocalTwinFailureSimulation(failedZone: string) {
  const base = await getLocalTwinGraphExport();
  const rows = await loadSustainabilityRows();
  const byZone = latestRowByZone(rows);

  const nodes: LocalNode[] = base.nodes.map((n) => ({ ...n, status: 'normal' }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const impacted: Record<string, { impact_type: string; reduction_percent: number }> = {};

  for (const link of base.links) {
    if (link.source !== failedZone) continue;
    const neighbor = link.target;
    const n = byId.get(neighbor);
    if (!n) continue;

    const row = byZone.get(neighbor);
    let impactPct = 0;
    if (link.type === 'water_pipeline') {
      impactPct = 25;
      if (row) {
        const newSupply = row.water_supply_mgd * 0.75;
        n.water_stress = Math.round(Math.max(0, row.water_demand_mgd - newSupply) * 10) / 10;
      }
    } else if (link.type === 'energy_grid') {
      impactPct = 20;
      if (row) {
        n.energy_mu = Math.round(row.energy_consumption_mu * 0.8 * 10) / 10;
      }
    } else if (link.type === 'waste_transport') {
      impactPct = 30;
      if (row) {
        const proc = row.waste_processed_tpd * 0.7;
        const gen = Math.max(row.waste_generated_tpd, 1);
        n.score = Math.round(Math.max(0, n.score - 5 + (proc / gen) * 2) * 10) / 10;
      }
    }

    n.status = 'impacted';
    if (!impacted[neighbor]) {
      impacted[neighbor] = { impact_type: link.type, reduction_percent: impactPct };
    }
  }

  const failedNode = byId.get(failedZone);
  if (failedNode) failedNode.status = 'failed';

  const nNodes = nodes.length;
  const resilience = Math.round((1 - Object.keys(impacted).length / Math.max(1, nNodes - 1)) * 1000) / 10;

  return {
    nodes,
    links: base.links,
    metrics: base.metrics,
    failed_zone: failedZone,
    directly_impacted: impacted,
    network_resilience_pct: resilience,
  };
}
