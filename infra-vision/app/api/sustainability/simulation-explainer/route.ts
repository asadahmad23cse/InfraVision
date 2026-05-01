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
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }
    return NextResponse.json({ explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
