'use client';

import React from 'react';
import { Shield, Info, AlertTriangle, Lightbulb } from 'lucide-react';

interface SocialContext {
  zone: string;
  population_density: string;
  income_level: string;
  infrastructure_score: number;
  risk_level: string;
  insight: string;
  root_cause: string;
  policy_hint: string;
}

export default function SocialIntelligenceCard({ context }: { context: SocialContext }) {
  const getRiskColor = (level: string) => {
    if (level.includes('high')) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (level.includes('medium')) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Social Intelligence
          </h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Socio-Economic Reasoning Layer</p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getRiskColor(context.risk_level)}`}>
          {context.risk_level} Risk
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Pop. Density</p>
          <p className="text-sm text-zinc-300 font-medium capitalize">{context.population_density}</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Income Level</p>
          <p className="text-sm text-zinc-300 font-medium capitalize">{context.income_level}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="mt-1">
            <Info className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">Root Cause Analysis</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{context.root_cause}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="mt-1">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">Actionable Policy Hint</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{context.policy_hint}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest">
          <span>Infrastructure Score</span>
          <span>{context.infrastructure_score}/100</span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-1000"
            style={{ width: `${context.infrastructure_score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
