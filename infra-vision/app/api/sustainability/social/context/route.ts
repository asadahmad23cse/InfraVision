import { NextResponse } from 'next/server';

function localSocialContext(zone: string) {
  const highRisk = /north-east|east|central/i.test(zone);
  return {
    zone,
    population_density: highRisk ? 'high' : 'medium',
    income_level: highRisk ? 'low-to-middle' : 'mixed',
    infrastructure_score: highRisk ? 48 : 66,
    risk_level: highRisk ? 'high' : 'medium',
    insight: `${zone} needs policy sequencing that accounts for density, affordability, and infrastructure capacity.`,
    root_cause: highRisk
      ? 'High density and weaker utility capacity amplify water stress and service disruption risk.'
      : 'Moderate density and mixed infrastructure quality create uneven sustainability outcomes.',
    policy_hint: highRisk
      ? 'Prioritize subsidized water conservation, decentralized treatment, and heat-resilient service delivery.'
      : 'Use targeted upgrades and ward-level monitoring before large capital expansion.',
    source: 'local-fallback',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone') || 'Central Delhi';
  const backendUrl = process.env.SUSTAINABILITY_API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/social/context?zone=${encodeURIComponent(zone)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // Fall through to local context.
    }
  }

  return NextResponse.json(localSocialContext(zone));
}
