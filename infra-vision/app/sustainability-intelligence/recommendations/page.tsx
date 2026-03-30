'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, AlertCircle, ChevronRight, CheckCircle2, Target, ArrowRight } from 'lucide-react';
import { getZoneRecommendations, getZones, type ZoneRecommendations } from '@/lib/sustainabilityApi';

export default function RecommendationsPage() {
  const [zones, setZones] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ZoneRecommendations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getZones().then((r) => setZones(r.zones || []));
  }, []);

  useEffect(() => {
    if (!selectedZone) {
      setRecommendations(null);
      return;
    }
    setLoading(true);
    getZoneRecommendations(selectedZone)
      .then(setRecommendations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedZone]);

  const urgencyColors: Record<string, { bg: string, text: string, ring: string, glow: string }> = {
    Critical: { bg: 'from-rose-500/20 to-rose-600/5', text: 'text-rose-400', ring: 'border-rose-500/30', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' },
    High: { bg: 'from-amber-500/20 to-amber-600/5', text: 'text-amber-400', ring: 'border-amber-500/30', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
    Medium: { bg: 'from-yellow-500/20 to-yellow-600/5', text: 'text-yellow-400', ring: 'border-yellow-500/30', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]' },
    Low: { bg: 'from-emerald-500/20 to-emerald-600/5', text: 'text-emerald-400', ring: 'border-emerald-500/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse"></div>
          <p className="text-sm text-cyan-400/80 font-semibold tracking-widest uppercase">Action Engine</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 tracking-tight">
          AI CapEx Recommendations
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          Algorithmic extraction of high-leverage interventions. Generate zone-specific, mathematically optimized project lists ranked by impact and ROI.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Step 1: Zone Selection */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Step 01 / Targeting</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Select Node</h2>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {zones.map((z) => {
              const isActive = selectedZone === z;
              return (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] ${
                    isActive
                      ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  {isActive && <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-400/20 blur-xl rounded-full"></div>}
                  <span className={`font-semibold relative z-10 ${isActive ? 'text-cyan-400' : 'text-white'}`}>{z}</span>
                  {isActive && <ChevronRight className="w-5 h-5 text-cyan-400 absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Step 2: AI Report Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col">
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Step 02 / Strategic Brief</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><Lightbulb className="w-5 h-5 text-cyan-400"/> Generative Action Plan</h2>
            </div>
            {selectedZone && <span className="px-3 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">{selectedZone} Array</span>}
          </div>

          <div className="flex-1 relative z-10 flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4 text-cyan-400/50">
                <div className="w-10 h-10 border-2 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Compiling neural recommendations...</span>
              </div>
            ) : recommendations ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Meta Summary Blocks */}
                <div className="grid grid-cols-2 gap-5">
                  <div className={`p-5 rounded-2xl bg-gradient-to-br border ${urgencyColors[recommendations.urgency]?.bg || 'bg-slate-700/50'} ${urgencyColors[recommendations.urgency]?.ring || 'border-slate-600'} ${urgencyColors[recommendations.urgency]?.glow || ''}`}>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><AlertCircle className={`w-3 h-3 ${urgencyColors[recommendations.urgency]?.text || 'text-white'}`}/> Primary Network Risk</p>
                    <p className={`text-2xl font-black ${urgencyColors[recommendations.urgency]?.text || 'text-white'}`}>{recommendations.biggest_risk}</p>
                  </div>
                  <div className={`p-5 rounded-2xl bg-gradient-to-br border ${urgencyColors[recommendations.urgency]?.bg || 'bg-slate-700/50'} ${urgencyColors[recommendations.urgency]?.ring || 'border-slate-600'} ${urgencyColors[recommendations.urgency]?.glow || ''}`}>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><Target className={`w-3 h-3 ${urgencyColors[recommendations.urgency]?.text || 'text-white'}`}/> Required Velocity</p>
                    <p className={`text-2xl font-black ${urgencyColors[recommendations.urgency]?.text || 'text-white'}`}>{recommendations.urgency.toUpperCase()}</p>
                  </div>
                </div>

                {/* Score Projection */}
                <div className="flex items-center justify-between p-6 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                  <div className="text-center">
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Current State</p>
                    <p className="text-3xl font-black text-white/50">{recommendations.current_score}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-6">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent relative flex items-center justify-center">
                      <div className="bg-[#0B1220] px-2 text-cyan-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-cyan-500/20 rounded-full py-0.5"><ArrowRight className="w-3 h-3"/> Delta</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Optimized Execution</p>
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-lime-300">{recommendations.projected_score_if_actions_taken}</p>
                  </div>
                </div>

                {/* Top Interventions List */}
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Ranked Capital Interventions</p>
                  <div className="space-y-4">
                    {recommendations.top_interventions.map((int, i) => (
                      <div key={i} className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center font-bold text-cyan-400 flex-shrink-0 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-colors">
                            {i+1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white text-lg mb-1 group-hover:text-cyan-100 transition-colors">{int.action}</p>
                            <p className="text-sm text-white/60 mb-3">{int.impact}</p>
                            
                            <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                              <span className="flex items-center gap-1.5 text-xs font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                                EST. COST: ₹{int.cost_cr} Cr
                              </span>
                              <span className="flex items-center gap-1.5 text-xs font-bold font-mono text-white/60 bg-black/40 px-2 py-1 rounded border border-white/5">
                                ROI WINDOW: {int.timeline_years} YRS
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-cyan-400/50" />
                </div>
                <p className="text-sm text-white/80 font-medium tracking-wide">Awaiting Node Input</p>
                <p className="text-xs text-white/40 mt-1 max-w-[250px]">Select a region from the targeting panel to synthesize prioritized capital interventions.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
