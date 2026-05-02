'use client';

import React from 'react';
import { Brain, Scale, Users, TrendingUp } from 'lucide-react';

interface PolicyImpact {
  policy: string;
  explanation: string;
  trade_off: string;
  social_impact: string;
}

export default function PolicyImpactCard({ impact }: { impact: PolicyImpact }) {
  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-zinc-900/40 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-500/20 p-2 rounded-lg">
          <Brain className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Decision Reasoning</h3>
          <p className="text-[10px] text-indigo-300/60 uppercase tracking-[0.2em]">Policy Intelligence Layer</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative pl-6 border-l border-indigo-500/30">
          <TrendingUp className="absolute -left-2 top-0 w-4 h-4 text-indigo-400 bg-zinc-900" />
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight mb-1">Why this impact?</p>
          <p className="text-sm text-zinc-300 leading-relaxed italic">"{impact.explanation}"</p>
        </div>

        <div className="relative pl-6 border-l border-amber-500/30">
          <Scale className="absolute -left-2 top-0 w-4 h-4 text-amber-400 bg-zinc-900" />
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight mb-1">Policy Trade-off</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{impact.trade_off}</p>
        </div>

        <div className="relative pl-6 border-l border-emerald-500/30">
          <Users className="absolute -left-2 top-0 w-4 h-4 text-emerald-400 bg-zinc-900" />
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight mb-1">Social Consequence</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{impact.social_impact}</p>
        </div>
      </div>

      <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/5 text-center">
        <p className="text-[11px] text-indigo-300 font-medium">
          Strategic Recommendation: Priority implementation in high-density corridors.
        </p>
      </div>
    </div>
  );
}
