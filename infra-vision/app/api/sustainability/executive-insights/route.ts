import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/geminiServer";
import { HIGH_SIGNAL_STRICT_RULE } from "@/lib/sustainabilityHighSignal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = [
    "You are an Urban Sustainability Expert for the Delhi Government.",
    HIGH_SIGNAL_STRICT_RULE,
    `Data Context: ${JSON.stringify(body.data_context ?? {})}`,
    `Forecast Data: ${JSON.stringify(body.forecast_data ?? {})}`,
    "Task: Identify the Red Alert zone, explain why by linking water stress with population or emissions, and provide one cross-sector advice.",
  ].join("\n");

  try {
    const insight = await generateGeminiText(prompt);
    if (!insight) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }
    return NextResponse.json({ insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
