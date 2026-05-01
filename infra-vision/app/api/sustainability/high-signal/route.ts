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
import { generateGeminiText } from "@/lib/geminiServer";

async function withGemini(prompt: string, fallback: string) {
  try {
    return (await generateGeminiText(prompt)) || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode ?? "");

  if (mode === "cost-impact") {
    const allocations = (body.allocations ?? []) as SectorAllocation[];
    const prompt = buildCostImpactJustifierPrompt({
        optimizerOutput: body.optimizerOutput ?? {},
        costMetadata: body.costMetadata ?? {},
        budgetCr: Number(body.budgetCr ?? 0),
        allocations,
        ignoredSectors: body.ignoredSectors ?? [],
      });
    const fallback = getCostImpactJustification({
        budgetCr: Number(body.budgetCr ?? 0),
        allocations,
        ignoredSectors: body.ignoredSectors ?? [],
      });
    return NextResponse.json({ prompt, insight: await withGemini(prompt, fallback) });
  }

  if (mode === "causal-anomaly") {
    const input = {
      metric: String(body.metric ?? "Metric"),
      zone: String(body.zone ?? "Unknown Zone"),
      externalContext: body.externalContext ?? {},
    };
    const prompt = buildCausalAnomalyPrompt(input);
    return NextResponse.json({ prompt, insight: await withGemini(prompt, getCausalAnomalyInsight(input)) });
  }

  if (mode === "financial-social") {
    const input = {
      policy: String(body.policy ?? "Policy"),
      valuePercent: Number(body.valuePercent ?? 0),
      scoreGain: Number(body.scoreGain ?? 0),
      totalCostCr: Number(body.totalCostCr ?? 0),
      systemResult: body.systemResult ?? {},
    };
    const prompt = buildFinancialSocialConsequencePrompt(input);
    return NextResponse.json({ prompt, insight: await withGemini(prompt, getFinancialSocialConsequence(input)) });
  }

  if (mode === "executive-brief") {
    const prompt = buildExecutiveBriefPrompt({
        cityWideData: body.cityWideData ?? {},
        budgetSpentCr: Number(body.budgetSpentCr ?? 0),
        externalFactors: body.externalFactors ?? {},
      });
    const fallback = getExecutiveRedAlertBrief({
        budgetSpentCr: Number(body.budgetSpentCr ?? 0),
        zones: (body.zones ?? []) as ZoneRiskSnapshot[],
        externalFactors: body.externalFactors ?? {},
      });
    return NextResponse.json({ prompt, insight: await withGemini(prompt, fallback) });
  }

  if (mode === "synergy") {
    const input = {
      zone: String(body.zone ?? "Unknown Zone"),
      wasteType: String(body.wasteType ?? "waste"),
      demandType: String(body.demandType ?? "resource demand"),
      resourceMetadata: body.resourceMetadata ?? {},
    };
    const prompt = buildSynergyOptimizerPrompt(input);
    return NextResponse.json({ prompt, insight: await withGemini(prompt, getSynergyOptimizationInsight(input)) });
  }

  return NextResponse.json(
    { error: "Unknown mode. Use cost-impact, causal-anomaly, financial-social, executive-brief, or synergy." },
    { status: 400 },
  );
}
