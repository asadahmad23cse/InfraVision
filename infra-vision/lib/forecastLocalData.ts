import { loadSustainabilityRows } from '@/lib/sustainabilityLocalData';

export async function getLocalEnergyForecast(zone: string, renewableTarget: number) {
  const rows = await loadSustainabilityRows();
  const zoneRows = rows.filter((r) => r.zone === zone).sort((a, b) => a.year - b.year);
  const latest = zoneRows[zoneRows.length - 1];
  if (!latest) {
    throw new Error(`No CSV data for zone ${zone}`);
  }
  const currentRenewable = latest.renewable_share_percent;
  const currentSolar = latest.solar_capacity_mw;
  const forecastEnergyMu = latest.energy_consumption_mu;
  const predictedSolar = currentSolar;
  const predictedRenewable = currentRenewable;
  const denominatorShare = predictedRenewable > 0 ? predictedRenewable : currentRenewable;
  const solarPerPct = denominatorShare > 0 ? predictedSolar / denominatorShare : 20;
  const requiredDelta = Math.max(0, renewableTarget - currentRenewable);
  const mwNeeded = requiredDelta * solarPerPct;
  const ghgReduction = forecastEnergyMu * (requiredDelta / 100) * 0.5;
  const costCr = mwNeeded * 0.45;
  return {
    zone,
    renewable_target: renewableTarget,
    solar_mw_needed: Math.round(mwNeeded * 10) / 10,
    ghg_reduction_mtco2: Math.round(ghgReduction * 10) / 10,
    cost_estimate_cr: Math.round(costCr * 10) / 10,
    years_to_achieve: Math.max(1, Math.ceil(mwNeeded / 35)),
  };
}

export async function getLocalWasteForecast(zone: string, recyclingIncrease: number) {
  const rows = await loadSustainabilityRows();
  const zoneRows = rows.filter((r) => r.zone === zone).sort((a, b) => a.year - b.year);
  const latest = zoneRows[zoneRows.length - 1];
  if (!latest) {
    throw new Error(`No CSV data for zone ${zone}`);
  }
  const wasteGen = Math.max(0.1, latest.waste_generated_tpd);
  const landfillPct = latest.landfill_dependency_percent || 50;
  const ceIndex = Math.min(100, Math.max(0, 100 - landfillPct * 0.6 + latest.sustainability_score * 0.15));
  const newCe = Math.min(100, ceIndex + recyclingIncrease);
  const landfillReduction = wasteGen * (landfillPct / 100) * (recyclingIncrease / 100);
  const ghgSavings = landfillReduction * 0.0005;
  return {
    zone,
    recycling_increase: recyclingIncrease,
    current_ce_index: Math.round(ceIndex * 10) / 10,
    projected_ce_index: Math.round(newCe * 10) / 10,
    landfill_reduction_tpd: Math.round(landfillReduction * 10) / 10,
    ghg_savings_mtco2: Math.round(ghgSavings * 100) / 100,
    years_to_achieve: Math.max(3, Math.ceil(recyclingIncrease / 5)),
  };
}
