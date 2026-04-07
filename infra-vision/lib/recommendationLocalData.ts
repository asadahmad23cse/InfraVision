import { loadSustainabilityRows, type SustainabilityRow } from '@/lib/sustainabilityLocalData';

type RuleDef = {
  id: string;
  check: (r: SustainabilityRow) => boolean;
  severity: number;
  alert_type: string;
  risk: string;
  action: string;
  impact: string;
  cost_cr: number;
  timeline_years: number;
  co_benefits: string[];
};

const RULES: RuleDef[] = [
  {
    id: 'water_critical',
    check: (r) => r.water_demand_mgd > Math.max(r.water_supply_mgd, 1e-6) * 1.2,
    severity: 10,
    alert_type: 'WATER_STRESS',
    risk: 'Water',
    action: 'Expand water supply capacity & implement 24x7 metered supply',
    impact: 'Reduce water stress index by 0.3',
    cost_cr: 180,
    timeline_years: 3,
    co_benefits: ['Reduce groundwater extraction', 'Improve public health'],
  },
  {
    id: 'water_high',
    check: (r) => r.water_demand_mgd > Math.max(r.water_supply_mgd, 1e-6) * 1.05,
    severity: 7,
    alert_type: 'WATER_STRESS',
    risk: 'Water',
    action: 'Deploy rainwater harvesting & wastewater recycling programs',
    impact: 'Reduce per-capita water demand by 15%',
    cost_cr: 90,
    timeline_years: 2,
    co_benefits: ['Groundwater recharge', 'Reduced DJB bill'],
  },
  {
    id: 'waste_critical',
    check: (r) => r.landfill_dependency_percent > 55,
    severity: 9,
    alert_type: 'WASTE_OVERFLOW',
    risk: 'Waste',
    action: 'Build new material recovery facilities & ban single-use plastics',
    impact: 'Divert 40% waste from landfill within 2 years',
    cost_cr: 120,
    timeline_years: 2,
    co_benefits: ['Reduce methane emissions', 'Circular economy jobs'],
  },
  {
    id: 'waste_high',
    check: (r) => r.landfill_dependency_percent > 35,
    severity: 6,
    alert_type: 'WASTE_OVERFLOW',
    risk: 'Waste',
    action: 'Scale up waste-to-energy plants & composting capacity',
    impact: 'Process 20% additional waste daily',
    cost_cr: 75,
    timeline_years: 3,
    co_benefits: ['Power generation', 'Reduced odour & disease'],
  },
  {
    id: 'solar_critical',
    check: (r) => r.renewable_share_percent < 1.5,
    severity: 8,
    alert_type: 'ENERGY_CRISIS',
    risk: 'Energy',
    action: 'Emergency rooftop solar deployment (500 MW target)',
    impact: 'Add 500 MW solar, reduce GHG by 2.5 MtCO2/yr',
    cost_cr: 250,
    timeline_years: 2,
    co_benefits: ['Energy security', 'Reduced electricity bills'],
  },
  {
    id: 'solar_low',
    check: (r) => r.renewable_share_percent < 5,
    severity: 5,
    alert_type: 'LOW_RENEWABLE',
    risk: 'Energy',
    action: 'Solar rooftop mandate for commercial buildings + subsidies',
    impact: 'Renewable share from 2% → 10% in 3 years',
    cost_cr: 150,
    timeline_years: 3,
    co_benefits: ['Air quality', 'GHG reduction'],
  },
  {
    id: 'green_critical',
    check: (r) => (r.green_space_sqkm * 1e6) / Math.max(1, r.population) < 2.0,
    severity: 8,
    alert_type: 'GREEN_DEFICIT',
    risk: 'Green',
    action: 'Emergency urban forest creation + rooftop gardens mandate',
    impact: 'Add 15 sqkm green space, reduce urban heat by 2°C',
    cost_cr: 100,
    timeline_years: 4,
    co_benefits: ['Heat island reduction', 'Mental health', 'Air quality'],
  },
  {
    id: 'green_low',
    check: (r) => (r.green_space_sqkm * 1e6) / Math.max(1, r.population) < 5.0,
    severity: 5,
    alert_type: 'GREEN_DEFICIT',
    risk: 'Green',
    action: 'Develop linear parks, green corridors, and tree plantation drives',
    impact: 'Increase green cover by 20%',
    cost_cr: 60,
    timeline_years: 3,
    co_benefits: ['Biodiversity', 'Stormwater management'],
  },
  {
    id: 'ghg_critical',
    check: (r) => r.ghg_emissions_mtco2 > 6.5,
    severity: 9,
    alert_type: 'CARBON_SPIKE',
    risk: 'Emissions',
    action: 'Accelerate EV adoption + expand metro + phase out coal boilers',
    impact: 'Reduce transport GHG by 30%, total GHG by 15%',
    cost_cr: 300,
    timeline_years: 5,
    co_benefits: ['Air quality', 'Public health savings'],
  },
  {
    id: 'groundwater',
    check: (r) => r.groundwater_extraction_mgd > Math.max(r.groundwater_recharge_mgd, 1) * 1.1,
    severity: 7,
    alert_type: 'GROUNDWATER_STRESS',
    risk: 'Water',
    action: 'Aquifer recharge programs (check dams, percolation pits)',
    impact: 'Recharge groundwater by 15% within 2 years',
    cost_cr: 70,
    timeline_years: 2,
    co_benefits: ['Long-term water security', 'Reduced subsidence risk'],
  },
];

export async function getLocalZoneRecommendations(zone: string) {
  const rows = await loadSustainabilityRows();
  const zoneRows = rows.filter((r) => r.zone === zone).sort((a, b) => a.year - b.year);
  const row = zoneRows[zoneRows.length - 1];
  if (!row) {
    return {
      zone,
      current_score: 55,
      projected_score_with_top3: 55,
      alerts_count: 0,
      biggest_risk: 'None',
      urgency: 'Low' as const,
      top_interventions: [] as Array<Record<string, unknown>>,
    };
  }

  const triggered: Array<Record<string, unknown>> = [];
  for (const rule of RULES) {
    try {
      if (rule.check(row)) {
        const cost = rule.cost_cr;
        const scoreImpact = Math.max(1, (rule.severity / 10) * 15);
        const roi = (scoreImpact * 10) / Math.max(1, cost) * 100;
        triggered.push({
          id: rule.id,
          severity: rule.severity,
          alert_type: rule.alert_type,
          risk: rule.risk,
          action: rule.action,
          impact: rule.impact,
          cost_cr: rule.cost_cr,
          timeline_years: rule.timeline_years,
          co_benefits: rule.co_benefits,
          roi_percent: Math.round(roi * 100) / 100,
          score_impact_points: Math.round(scoreImpact * 10) / 10,
        });
      }
    } catch {
      /* skip rule */
    }
  }

  triggered.sort((a, b) => (b.severity as number) - (a.severity as number));

  const currentScore = row.sustainability_score || 55;
  const top3 = triggered.slice(0, 3) as Array<{ score_impact_points?: number }>;
  const scoreAfter = Math.min(
    100,
    currentScore + top3.reduce((s, t) => s + (t.score_impact_points ?? 0), 0),
  );

  const urgency =
    triggered.length && (triggered[0].severity as number) >= 9
      ? 'Critical'
      : triggered.length && (triggered[0].severity as number) >= 7
        ? 'High'
        : triggered.length
          ? 'Medium'
          : 'Low';

  return {
    zone,
    current_score: Math.round(currentScore * 10) / 10,
    projected_score_with_top3: Math.round(scoreAfter * 10) / 10,
    alerts_count: triggered.length,
    biggest_risk: triggered.length ? (triggered[0].risk as string) : 'None',
    urgency,
    top_interventions: triggered.slice(0, 5),
  };
}
