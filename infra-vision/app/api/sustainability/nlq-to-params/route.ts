import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/geminiServer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = [
    "Convert this user query into parameters for the InfraVision optimization engine.",
    `User Query: ${JSON.stringify(String(body.query ?? ""))}`,
    "Return JSON only with keys: target_metric, constraint_budget, priority_zone, secondary_constraint, focus_areas.",
    "If the intent is unclear, return JSON with an error key asking for budget or primary goal.",
  ].join("\n");

  try {
    const params = await generateGeminiText(prompt);
    if (!params) {
      return NextResponse.json({
        params: JSON.stringify({
          error: "Please provide budget and primary optimization goal.",
        }),
        fallback: true,
      });
    }
    return NextResponse.json({ params });
  } catch (error) {
    return NextResponse.json({
      params: JSON.stringify({
        error: "Please provide budget and primary optimization goal.",
      }),
      fallback: true,
      warning: error instanceof Error ? error.message : "Gemini request failed",
    });
  }
}
