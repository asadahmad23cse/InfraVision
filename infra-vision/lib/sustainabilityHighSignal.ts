type JsonRecord = Record<string, unknown>;

export type SectorAllocation = {
  sector: string;
  budgetCr: number;
  impactScore?: number;
};

export type ExternalContext = {
  current_temp?: string | number;
  avg_traffic_index?: string | number;
  industrial_status?: string;
  [key: string]: unknown;
};

export type ZoneRiskSnapshot = {
  zone: string;
  waterGapMgd?: number;
  ghgMtco2?: number;
  sustainabilityScore?: number;
  emergencyCostCr?: number;
};

export const HIGH_SIGNAL_STRICT_RULE =
  "Strict Rule: Do not use words like 'Sure', 'Here is', or 'I think'. Start directly with the insight. Max 2 lines only.";

function moneyCr(value: number) {
  return `${Math.round(value * 10) / 10} Cr`;
}

function normalizeSector(name: string) {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function impactPerRupee(item: SectorAllocation) {
  return (item.impactScore ?? 0) / Math.max(1, item.budgetCr);
}

export function buildCostImpactJustifierPrompt(input: {
  optimizerOutput: JsonRecord;
  costMetadata: JsonRecord;
  budgetCr: number;
  allocations: SectorAllocation[];
  ignoredSectors?: SectorAllocation[];
}) {
  return [
    "Act as a Fiscal Sustainability Analyst.",
    HIGH_SIGNAL_STRICT_RULE,
    `LP Optimizer Output: ${JSON.stringify(input.optimizerOutput)}`,
    `Cost Metadata: ${JSON.stringify(input.costMetadata)}`,
    `Decision: Budget ${input.budgetCr} Cr allocated to ${JSON.stringify(input.allocations)}.`,
    `Ignored Sectors: ${JSON.stringify(input.ignoredSectors ?? [])}.`,
    "Task: Explain why this is the most efficient choice in 2 lines. Focus on Impact-per-Rupee. Mention if one sector was ignored because its cost was too high for the current budget.",
  ].join("\n");
}

export function getCostImpactJustification(input: {
  budgetCr: number;
  allocations: SectorAllocation[];
  ignoredSectors?: SectorAllocation[];
}) {
  const ranked = [...input.allocations].sort((a, b) => impactPerRupee(b) - impactPerRupee(a));
  const top = ranked[0];
  const second = ranked[1];
  const ignored = [...(input.ignoredSectors ?? [])].sort((a, b) => b.budgetCr - a.budgetCr)[0];

  const firstLine = top
    ? `${normalizeSector(top.sector)} gets ${moneyCr(top.budgetCr)} because it delivers the strongest impact-per-rupee in this budget window.`
    : `The optimizer preserved the ${moneyCr(input.budgetCr)} budget because no sector cleared the impact-per-rupee threshold.`;
  const secondLine = second
    ? `${normalizeSector(second.sector)} is the next best complement; ${ignored ? `${normalizeSector(ignored.sector)} was ignored because its cost is too high for the current budget.` : "no higher-cost sector was excluded on affordability grounds."}`
    : ignored
      ? `${normalizeSector(ignored.sector)} was ignored because its cost is too high for the current budget.`
      : "No secondary sector was required to meet the target efficiently.";

  return [firstLine, secondLine].join("\n");
}

export function buildCausalAnomalyPrompt(input: {
  metric: string;
  zone: string;
  externalContext: ExternalContext;
}) {
  return [
    "Act as an Urban Climate Expert.",
    HIGH_SIGNAL_STRICT_RULE,
    `We detected a spike in ${input.metric} in ${input.zone}.`,
    `External Context: ${JSON.stringify(input.externalContext)}.`,
    "Task: In max 2 lines, identify the Root Cause. Link the data spike to one external factor, such as high heat leading to peak AC demand or traffic congestion in narrow roads.",
  ].join("\n");
}

export function getCausalAnomalyInsight(input: {
  metric: string;
  zone: string;
  externalContext: ExternalContext;
}) {
  const tempRaw = input.externalContext.current_temp;
  const temp =
    typeof tempRaw === "number"
      ? tempRaw
      : typeof tempRaw === "string"
        ? Number(tempRaw.replace(/[^\d.-]/g, ""))
        : NaN;
  const trafficRaw = input.externalContext.avg_traffic_index;
  const traffic =
    typeof trafficRaw === "number"
      ? trafficRaw
      : typeof trafficRaw === "string"
        ? Number(trafficRaw.replace(/[^\d.-]/g, ""))
        : NaN;
  const industry = String(input.externalContext.industrial_status ?? "").toLowerCase();

  let cause = "external demand pressure";
  let link = "resource use intensified faster than normal baseline capacity.";
  if (Number.isFinite(temp) && temp >= 42) {
    cause = "extreme heat";
    link = "peak cooling demand likely pushed electricity use and GHG upward.";
  } else if (Number.isFinite(traffic) && traffic >= 8) {
    cause = "severe traffic congestion";
    link = "slow road speeds increase idling emissions and transport energy losses.";
  } else if (industry.includes("peak") || industry.includes("high")) {
    cause = "peak industrial activity";
    link = "industrial load is the most plausible driver behind the metric spike.";
  }

  return `${input.zone} ${input.metric} spike is most likely caused by ${cause}.\n${link}`;
}

export function buildFinancialSocialConsequencePrompt(input: {
  policy: string;
  valuePercent: number;
  scoreGain: number;
  totalCostCr: number;
  systemResult: JsonRecord;
}) {
  return [
    "Act as a Policy Strategist.",
    HIGH_SIGNAL_STRICT_RULE,
    `The user increased ${input.policy} by ${input.valuePercent}%.`,
    `System Result: Sustainability Score +${input.scoreGain}, Total Cost ${input.totalCostCr} Crores.`,
    `Full System Result: ${JSON.stringify(input.systemResult)}.`,
    "Task: Justify the consequence in 2 lines. If cost is high but score gain is low, mention Diminishing Returns. Mention one social consequence, such as high EV cost straining the transport budget for low-income zones.",
  ].join("\n");
}

export function getFinancialSocialConsequence(input: {
  policy: string;
  valuePercent: number;
  scoreGain: number;
  totalCostCr: number;
}) {
  const costPerScore = input.totalCostCr / Math.max(0.1, input.scoreGain);
  const isDiminishing = input.totalCostCr >= 500 && input.scoreGain < 3;
  const socialRisk = /ev|transport|bus/i.test(input.policy)
    ? "high mobility capex can strain transport budgets for low-income zones."
    : /water/i.test(input.policy)
      ? "tariff or metering upgrades may burden informal settlements without subsidies."
      : /green|tree/i.test(input.policy)
        ? "land conversion can displace informal vendors unless sites are selected carefully."
        : "uneven rollout can widen service gaps between high-income and low-income zones.";

  const firstLine = isDiminishing
    ? `${normalizeSector(input.policy)} shows Diminishing Returns: ${moneyCr(input.totalCostCr)} produces only +${input.scoreGain} score at ${moneyCr(costPerScore)} per score point.`
    : `${normalizeSector(input.policy)} adds +${input.scoreGain} score for ${moneyCr(input.totalCostCr)}, keeping the cost-impact tradeoff defensible.`;
  return `${firstLine}\nSocial consequence: ${socialRisk}`;
}

export function buildExecutiveBriefPrompt(input: {
  cityWideData: JsonRecord;
  budgetSpentCr: number;
  externalFactors: ExternalContext;
}) {
  return [
    "Act as the Chief Sustainability Officer.",
    HIGH_SIGNAL_STRICT_RULE,
    `Analyze the city-wide data: ${JSON.stringify(input.cityWideData)}.`,
    `Context: Budget Spent: ${input.budgetSpentCr}, External Factors: ${JSON.stringify(input.externalFactors)}.`,
    "Task: Give a Red Alert insight in 2 lines. Identify the zone with the worst Cost-of-Inaction, for example ignoring water gap in North Delhi will cost 3x more in emergency supply next year.",
  ].join("\n");
}

export function getExecutiveRedAlertBrief(input: {
  budgetSpentCr: number;
  zones: ZoneRiskSnapshot[];
  externalFactors?: ExternalContext;
}) {
  const worst = [...input.zones].sort((a, b) => {
    const aCost = a.emergencyCostCr ?? (a.waterGapMgd ?? 0) * 1.8 + (a.ghgMtco2 ?? 0) * 12 - (a.sustainabilityScore ?? 50);
    const bCost = b.emergencyCostCr ?? (b.waterGapMgd ?? 0) * 1.8 + (b.ghgMtco2 ?? 0) * 12 - (b.sustainabilityScore ?? 50);
    return bCost - aCost;
  })[0];
  const temp = input.externalFactors?.current_temp ? ` under ${input.externalFactors.current_temp} heat stress` : "";
  if (!worst) {
    return `Red Alert: city risk cannot be ranked because zone snapshots are missing${temp}.\nBudget spent ${moneyCr(input.budgetSpentCr)} needs verified zone-level cost-of-inaction data.`;
  }

  const waterCost = Math.max(1, Math.round((worst.waterGapMgd ?? 0) * 1.8));
  return `Red Alert: ${worst.zone} has the worst Cost-of-Inaction${temp}, driven by water gap and emissions pressure.\nIgnoring it can push emergency supply exposure toward ${moneyCr(waterCost)}, making delayed action costlier than planned prevention.`;
}

export function buildSynergyOptimizerPrompt(input: {
  zone: string;
  wasteType: string;
  demandType: string;
  resourceMetadata: JsonRecord;
}) {
  return [
    "Act as a Circular Economy Expert.",
    HIGH_SIGNAL_STRICT_RULE,
    `${input.zone} has high ${input.wasteType} and high ${input.demandType}.`,
    `Resource Metadata: ${JSON.stringify(input.resourceMetadata)}.`,
    "Task: Propose one synergy in 2 lines. Focus on Cost Saving, for example using treated water for industrial cooling here will save the city Z Crores annually.",
  ].join("\n");
}

export function getSynergyOptimizationInsight(input: {
  zone: string;
  wasteType: string;
  demandType: string;
  resourceMetadata: JsonRecord;
}) {
  const wasteToEnergyRate = Number(input.resourceMetadata.waste_to_energy_rate ?? 0);
  const treatedWaterSave = Number(input.resourceMetadata.treated_water_cost_save ?? 0);
  if (/energy/i.test(input.demandType) && wasteToEnergyRate > 0) {
    const savings = Math.round(wasteToEnergyRate * 12 * 10) / 10;
    return `${input.zone} should route ${input.wasteType} into waste-to-energy supply for local peak demand.\nThis can save about ${moneyCr(savings)} annually by replacing grid purchases and landfill handling.`;
  }
  if (/water/i.test(input.demandType) && treatedWaterSave > 0) {
    const savings = Math.round(treatedWaterSave * 10) / 10;
    return `${input.zone} should reuse treated water for industrial cooling and horticulture instead of fresh supply.\nThis can save about ${moneyCr(savings)} annually while reducing pressure on potable water networks.`;
  }
  return `${input.zone} should convert ${input.wasteType} into an input for the highest-demand department.\nThe synergy lowers disposal cost and offsets new ${input.demandType} procurement.`;
}
