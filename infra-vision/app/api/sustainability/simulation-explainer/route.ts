import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/geminiServer";
import { HIGH_SIGNAL_STRICT_RULE } from "@/lib/sustainabilityHighSignal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = [
    "Act as a Policy Analyst for Delhi's Digital Twin.",
    HIGH_SIGNAL_STRICT_RULE,
    `User Inputs: ${JSON.stringify(body.user_inputs ?? {})}`,
    `System Result: ${JSON.stringify(body.system_result ?? {})}`,
    "Task: Justify the result. Mention Diminishing Returns if spending is high with low score gain, and include one Delhi-specific social or infrastructure challenge.",
  ].join("\n");

  try {
    const explanation = await generateGeminiText(prompt);
    if (!explanation) {
      return NextResponse.json({
        explanation: "The policy improves sustainability only where the added spend directly reduces a binding constraint.\nIf cost rises faster than score gain, this indicates Diminishing Returns and may strain low-income-zone service budgets.",
        fallback: true,
      });
    }
    return NextResponse.json({ explanation });
  } catch (error) {
    return NextResponse.json({
      explanation: "The policy improves sustainability only where the added spend directly reduces a binding constraint.\nIf cost rises faster than score gain, this indicates Diminishing Returns and may strain low-income-zone service budgets.",
      fallback: true,
      warning: error instanceof Error ? error.message : "Gemini request failed",
    });
  }
}
