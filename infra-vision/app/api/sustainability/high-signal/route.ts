import { NextRequest, NextResponse } from "next/server";
import {
  buildCausalAnomalyPrompt,
  buildCostImpactJustifierPrompt,
  buildExecutiveBriefPrompt,
  buildFinancialSocialConsequencePrompt,
  buildSynergyOptimizerPrompt,
  getCausalAnomalyInsight,
  getCostImpactJustification,
  getExecutiveRedAlertBrief,
  getFinancialSocialConsequence,
  getSynergyOptimizationInsight,
  type SectorAllocation,
  type ZoneRiskSnapshot,
} from "@/lib/sustainabilityHighSignal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode ?? "");

  if (mode === "cost-impact") {
    const allocations = (body.allocations ?? []) as SectorAllocation[];
    return NextResponse.json({
      prompt: buildCostImpactJustifierPrompt({
        optimizerOutput: body.optimizerOutput ?? {},
        costMetadata: body.costMetadata ?? {},
        budgetCr: Number(body.budgetCr ?? 0),
        allocations,
        ignoredSectors: body.ignoredSectors ?? [],
      }),
      insight: getCostImpactJustification({
        budgetCr: Number(body.budgetCr ?? 0),
        allocations,
        ignoredSectors: body.ignoredSectors ?? [],
      }),
    });
  }

  if (mode === "causal-anomaly") {
    const input = {
      metric: String(body.metric ?? "Metric"),
      zone: String(body.zone ?? "Unknown Zone"),
      externalContext: body.externalContext ?? {},
    };
    return NextResponse.json({
      prompt: buildCausalAnomalyPrompt(input),
      insight: getCausalAnomalyInsight(input),
    });
  }

  if (mode === "financial-social") {
    const input = {
      policy: String(body.policy ?? "Policy"),
      valuePercent: Number(body.valuePercent ?? 0),
      scoreGain: Number(body.scoreGain ?? 0),
      totalCostCr: Number(body.totalCostCr ?? 0),
      systemResult: body.systemResult ?? {},
    };
    return NextResponse.json({
      prompt: buildFinancialSocialConsequencePrompt(input),
      insight: getFinancialSocialConsequence(input),
    });
  }

  if (mode === "executive-brief") {
    return NextResponse.json({
      prompt: buildExecutiveBriefPrompt({
        cityWideData: body.cityWideData ?? {},
        budgetSpentCr: Number(body.budgetSpentCr ?? 0),
        externalFactors: body.externalFactors ?? {},
      }),
      insight: getExecutiveRedAlertBrief({
        budgetSpentCr: Number(body.budgetSpentCr ?? 0),
        zones: (body.zones ?? []) as ZoneRiskSnapshot[],
        externalFactors: body.externalFactors ?? {},
      }),
    });
  }

  if (mode === "synergy") {
    const input = {
      zone: String(body.zone ?? "Unknown Zone"),
      wasteType: String(body.wasteType ?? "waste"),
      demandType: String(body.demandType ?? "resource demand"),
      resourceMetadata: body.resourceMetadata ?? {},
    };
    return NextResponse.json({
      prompt: buildSynergyOptimizerPrompt(input),
      insight: getSynergyOptimizationInsight(input),
    });
  }

  return NextResponse.json(
    { error: "Unknown mode. Use cost-impact, causal-anomaly, financial-social, executive-brief, or synergy." },
    { status: 400 },
  );
}
