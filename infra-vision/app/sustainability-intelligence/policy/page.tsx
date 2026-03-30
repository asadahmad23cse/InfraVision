'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Sliders, Sparkles, Loader2, Play, GitMerge, FileCheck  } from 'lucide-react';
import { simulatePolicy, type PolicyParams, type PolicyResult } from '@/lib/sustainabilityApi';

const SLIDERS: { key: keyof PolicyParams; label: string; max: number; icon: string; color: string }[] = [
  { key: 'solar_increase', label: 'Solar CapEx Expansion', max: 100, icon: '☀️', color: 'from-amber-400 to-orange-500' },
  { key: 'waste_improvement', label: 'Waste Processing Upgrades', max: 50, icon: '♻️', color: 'from-violet-400 to-fuchsia-500' },
  { key: 'green_expansion', label: 'Reforestation Execution', max: 30, icon: '🌳', color: 'from-emerald-400 to-lime-500' },
  { key: 'water_conservation', label: 'Hydro-Conservation Protocols', max: 40, icon: '💧', color: 'from-cyan-400 to-blue-500' },
  { key: 'ev_adoption', label: 'EV Fleet Subsidization', max: 60, icon: '⚡', color: 'from-yellow-300 to-amber-500' },
  { key: 'public_transport', label: 'Public Transit Shift', max: 50, icon: '🚆', color: 'from-blue-400 to-indigo-500' },
];

export default function PolicySimulatorPage() {
  const [params, setParams] = useState<PolicyParams>({
    solar_increase: 0,
    waste_improvement: 0,
    green_expansion: 0,
    water_conservation: 0,
    ev_adoption: 0,
    public_transport: 0,
  });
  const [result, setResult] = useState<PolicyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const executeSimulation = async () => {
    setLoading(true);
    setHasRun(true);
    try {
      const r = await simulatePolicy(params);
      setResult(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const radarData = result ? [
    { metric: 'Carbon Control', value: Math.min(100, (result.ghg_reduction_mtco2 / 10) * 10), fullMark: 100 },
    { metric: 'Water Security', value: Math.min(100, result.water_savings_mgd * 2), fullMark: 100 },
    { metric: 'Circular Economy', value: Math.min(100, result.waste_diverted_tpd / 5), fullMark: 100 },
    { metric: 'Macro Composite', value: Math.min(100, result.sustainability_score_delta * 4), fullMark: 100 },
    { metric: 'Capital ROI', value: Math.min(100, result.roi_score * 5), fullMark: 100 },
  ] : [];

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_#e879f9] animate-pulse"></div>
          <p className="text-sm text-fuchsia-400/80 font-semibold tracking-widest uppercase">Legislative Sandbox</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 tracking-tight">
          Policy Simulation Engine
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          Real-time deterministic "What-If" modeling. Configure multi-lateral policy levers to extrapolate capital expenditure returns (ROI) across all sustainability axes.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Step 1: Policy Levers */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="xl:col-span-5 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl mix-blend-screen pointer-events-none group-hover:bg-fuchsia-500/10 transition-colors"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Input Topology</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><Sliders className="w-5 h-5 opacity-70"/> Intervention Sliders</h2>
            </div>
          </div>

          <div className="flex-1 space-y-7 relative z-10">
            {SLIDERS.map(({ key, label, max, icon, color }) => (
              <div key={key} className="group/slider">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-black/40 rounded text-xs">{icon}</span> {label}
                  </span>
                  <span className="text-white font-mono font-black text-sm px-2 py-0.5 bg-black/30 rounded border border-white/5">{params[key]}<span className="text-white/40 text-[10px]">%</span></span>
                </div>
                <div className="relative h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r ${color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                    style={{ width: `${(params[key] / max) * 100}%` }}
                  ></div>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    value={params[key]}
                    onChange={(e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          <button onClick={executeSimulation} disabled={loading}
            className="w-full mt-10 py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(192,132,252,0.4)] disabled:opacity-50 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 relative z-10">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> Compiling Trajectory...</> : <><Play className="w-4 h-4 fill-white"/> Execute Master Simulation</>}
          </button>
        </motion.div>

        {/* Next columns wrapper */}
        <div className="xl:col-span-7 grid grid-rows-2 gap-8">
          
          {/* Step 2: Impact Analytics */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className={`transition-all duration-500 ${!hasRun ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] h-full">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Simulation Output</p>
                  <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><FileCheck className="w-5 h-5 text-fuchsia-400"/> Calculated Master Matrices</h2>
                </div>
              </div>

              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-transparent border-t-fuchsia-500 rounded-full animate-spin"></div>
                    <span className="text-fuchsia-400 text-xs font-bold uppercase tracking-widest animate-pulse">Processing Multi-variants</span>
                  </div>
                </div>
              ) : result ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Carbon Deflation</p>
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300">-{result.ghg_reduction_mtco2.toFixed(1)} <span className="text-xs font-normal text-emerald-400/50">MT</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Water Salvaged</p>
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">+{result.water_savings_mgd.toFixed(1)} <span className="text-xs font-normal text-cyan-400/50">MGD</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-2xl">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Landfill Diverted</p>
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300">+{result.waste_diverted_tpd.toFixed(0)} <span className="text-xs font-normal text-violet-400/50">TPD</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Agg. Score Delta</p>
                    <p className="text-2xl font-black text-amber-400">+{result.sustainability_score_delta.toFixed(1)} <span className="text-xs font-normal text-amber-400/50">pts</span></p>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Capital Required</p>
                    <p className="text-2xl font-black text-white">₹{result.cost_estimate_cr.toFixed(0)} <span className="text-xs font-normal text-white/50">Cr</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Calculated ROI</p>
                    <p className="text-2xl font-black text-white z-10 relative">{result.roi_score.toFixed(2)}</p>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                  <p className="text-white/30 text-sm">Awaiting simulation trigger...</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Step 3: Spider Chart Matrix */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className={`transition-all duration-500 ${!hasRun ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            
             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] h-full flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Multi-Vector Dispersion</p>
                  <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">Impact Radar Topology</h2>
                </div>
              </div>

              <div className="flex-1 min-h-[300px]">
                 {result && radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 500 }} />
                      <PolarRadiusAxis angle={90} tick={false} domain={[0, 100]} axisLine={false} />
                      <Tooltip 
                        contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                        itemStyle={{color: '#fff', fontWeight: 600}}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Radar name="Simulated Yield (Nominalized)" dataKey="value" stroke="#e879f9" strokeWidth={3} fill="#c084fc" fillOpacity={0.3} dot={{ r: 4, fill: '#e879f9', strokeWidth: 0 }} style={{ filter: 'drop-shadow(0 0 10px rgba(232,121,249,0.5))' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                      <p className="text-white/30 text-sm">Radar mapping pending...</p>
                    </div>
                 )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
