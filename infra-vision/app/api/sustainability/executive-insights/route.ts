import { NextRequest, NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/geminiServer";
import { HIGH_SIGNAL_STRICT_RULE } from "@/lib/sustainabilityHighSignal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const weather = body.weather_context ?? await fetch(new URL('/api/sustainability/weather/delhi', req.url), {
    cache: 'no-store',
  }).then((res) => res.json()).catch(() => null);
  const temperature = Number(weather?.temperature_c ?? weather?.temp ?? 0);
  const prompt = [
    "You are an Urban Sustainability Expert for the Delhi Government.",
    HIGH_SIGNAL_STRICT_RULE,
    `Data Context: ${JSON.stringify(body.data_context ?? {})}`,
    `Forecast Data: ${JSON.stringify(body.forecast_data ?? {})}`,
    `Live Weather Context: ${JSON.stringify(weather ?? {})}`,
    temperature > 40 ? "Weather Rule: Temperature is above 40C, so prioritize water stress and heat-driven energy load in the insight." : "Weather Rule: Use weather only if it materially changes risk priority.",
    "Task: Identify the Red Alert zone, explain why by linking water stress with population or emissions, and provide one cross-sector advice.",
  ].join("\n");

  const fallbackInsight = temperature > 40
    ? "Red Alert: Delhi heat is above 40C, so water stress becomes the priority risk because demand and cooling loads rise together.\nPrioritize North-East water conservation with solar-powered treatment to reduce emergency supply cost and grid pressure."
    : "Red Alert: North-East is the immediate priority because water stress remains critical against the 2030 gap forecast.\nPair water conservation with solar-powered treatment to reduce emergency supply cost and grid load.";

  try {
    const insight = await generateGeminiText(prompt);
    if (!insight) {
      return NextResponse.json({
        insight: fallbackInsight,
        fallback: true,
      });
    }
    return NextResponse.json({ insight });
  } catch (error) {
    return NextResponse.json({
      insight: fallbackInsight,
      fallback: true,
      warning: error instanceof Error ? error.message : "Gemini request failed",
    });
  }
}
