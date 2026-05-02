import { NextResponse } from 'next/server';
import { generateGeminiText } from '@/lib/geminiServer';
import { HIGH_SIGNAL_STRICT_RULE } from '@/lib/sustainabilityHighSignal';

function fallbackExplainer(body: { user_inputs?: Record<string, number>; system_result?: Record<string, number> }) {
  const result = body.system_result ?? {};
  const cost = Number(result.cost_estimate_cr ?? 0);
  const score = Number(result.sustainability_score_delta ?? 0);
  const policy = Object.entries(body.user_inputs ?? {})
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? 'policy mix';
  const diminishing = cost > 500 && score < 3;

  return {
    policy,
    explanation: diminishing
      ? `Diminishing Returns: Rs ${Math.round(cost)} Cr produces only +${score.toFixed(1)} score because the selected lever is no longer the binding constraint.`
      : `The ${policy.replace(/_/g, ' ')} lever improves the binding sustainability constraint and lifts the city score by +${score.toFixed(1)} points.`,
    trade_off: cost > 0
      ? `Capital requirement is Rs ${Math.round(cost)} Cr, so rollout should be sequenced by worst-risk zones first.`
      : 'No major fiscal trade-off is visible until an intervention package is selected.',
    social_impact: /ev|transport/i.test(policy)
      ? 'High mobility spending can strain service budgets for low-income zones unless subsidies are protected.'
      : 'Benefits will be strongest where high-density neighborhoods receive targeted implementation support.',
    fallback: true,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = [
    'Act as a Policy Strategist.',
    HIGH_SIGNAL_STRICT_RULE,
    `User Inputs: ${JSON.stringify(body.user_inputs ?? {})}`,
    `System Result: ${JSON.stringify(body.system_result ?? {})}`,
    'Task: Return compact JSON with policy, explanation, trade_off, and social_impact. Mention Diminishing Returns when cost is high but score gain is low.',
  ].join('\n');

  try {
    const text = await generateGeminiText(prompt);
    if (text) {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      try {
        return NextResponse.json(JSON.parse(cleaned));
      } catch {
        return NextResponse.json({ ...fallbackExplainer(body), explanation: cleaned, fallback: false });
      }
    }
  } catch {
    // Fall through to deterministic explainer.
  }

  return NextResponse.json(fallbackExplainer(body));
}
