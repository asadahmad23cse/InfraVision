type JsonRecord = Record<string, unknown>;

export type SectorAllocation = {
  sector: string;
  budgetCr: number;
  impactScore?: number;
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
