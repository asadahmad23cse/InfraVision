'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const ZONES = ["North","South","East","West","Central","North-East","North-West","South-West","South-East"];
const YEARS = Array.from({length: 12}, (_, i) => 2018 + i);

// Icon mapping for common features
const FEATURE_META: Record<string, { icon: string, label: string }> = {
  water_stress_index: { icon: '💧', label: 'Water Stress Index' },
  renewable_share_percent: { icon: '☀️', label: 'Renewable Energy Share' },
  ghg_emissions_mtco2: { icon: '🌡️', label: 'GHG Emissions (MtCO₂)' },
  population: { icon: '👥', label: 'Population Density' },
  energy_consumption_mu: { icon: '⚡', label: 'Energy Consumption (MU)' },
  waste_generated_tpd: { icon: '🗑️', label: 'Waste Generation (TPD)' },
};

function formatFeature(key: string) {
  if (FEATURE_META[key]) return FEATURE_META[key].label;
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function ExplainabilityPage() {
  const [zone, setZone] = useState('Central');
  const [year, setYear] = useState(2025);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async (targetZone: string, targetYear: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sustainability/ml/explain?zone=${encodeURIComponent(targetZone)}&year=${targetYear}`);
      if (!res.ok) throw new Error('Failed to fetch ML explanation');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when parameters change
  useEffect(() => {
    fetchExplanation(zone, year);
  }, [zone, year]);

  const waterfall = useMemo(() => {
    if (!result?.waterfall) return [];
    // Sort so positive impacts are at the top, negatives at the bottom
    return [...result.waterfall].sort((a, b) => b.shap_value - a.shap_value);
  }, [result]);

  const positiveSum = useMemo(() => waterfall.filter((f: any) => f.shap_value > 0).reduce((s: number, f: any) => s + f.shap_value, 0), [waterfall]);
  const negativeSum = useMemo(() => waterfall.filter((f: any) => f.shap_value < 0).reduce((s: number, f: any) => s + Math.abs(f.shap_value), 0), [waterfall]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPos = data.direction === 'positive';
      return (
        <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[240px]">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
            <span className="text-xl">{FEATURE_META[data.feature]?.icon || '📊'}</span>
            <p className="text-white font-bold text-sm tracking-wide">{formatFeature(data.feature)}</p>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">SHAP Value</span>
            <span className={`font-black text-lg ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPos ? '+' : ''}{data.shap_value.toFixed(4)}
            </span>
          </div>
          <p className={`text-[10px] mt-2 font-medium ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPos 
              ? '▶ This feature artificially INCREASES the predicted risk/score.'
              : '▼ This feature artificially DECREASES the predicted risk/score.'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3 text-emerald-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]">
           ⚡ Explainable AI Core
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-gray-400 tracking-tight">
          Algorithm Transparency (SHAP)
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Open the black box. SHAP (SHapley Additive exPlanations) values decompose exactly why the machine learning models assigned a specific sustainability score to any geographic zone.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* ── Left Sidebar (Controls) ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none" />
            
            <h2 className="text-white font-bold text-lg tracking-wide border-b border-white/10 pb-4 mb-6">Inference Parameters</h2>

            <div className="space-y-6">
              {/* Target Zone */}
              <div className="group/dropdown">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                  Target Inference Node
                  <span className="text-emerald-500">{(loading && zone) ? 'Syncing...' : 'Active'}</span>
                </label>
                <div className="relative">
                  <select value={zone} onChange={e => setZone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white font-semibold appearance-none outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner hover:border-white/20">
                    {ZONES.map(z => <option key={z} value={z} className="bg-gray-900">{z} Zone</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>

              {/* Temporal Index */}
              <div className="group/dropdown">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                  Temporal Matrix (Year)
                  <span className="text-emerald-500">Vector</span>
                </label>
                <div className="relative">
                  <select value={year} onChange={e => setYear(+e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white font-semibold appearance-none outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner hover:border-white/20">
                    {YEARS.map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Model info snippet */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SHAP Mechanics
              </p>
              <div className="space-y-4">
                <div className="flex gap-3 items-start p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-emerald-400 text-xs font-bold">↗</span>
                  </div>
                  <p className="text-[11px] text-emerald-100/70 leading-relaxed font-medium">
                    <strong className="text-emerald-400 font-bold block mb-0.5">Risk Multipliers</strong>
                    Green vectors mathematically push the final output higher, contributing positively to the base value.
                  </p>
                </div>
                <div className="flex gap-3 items-start p-3 rounded-xl bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/10">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                    <span className="text-rose-400 text-xs font-bold">↘</span>
                  </div>
                  <p className="text-[11px] text-rose-100/70 leading-relaxed font-medium">
                    <strong className="text-rose-400 font-bold block mb-0.5">Risk Mitigators</strong>
                    Red vectors exert downward pressure on the score, acting as protective factors against high risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Main Panel (Results) ── */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">

          {/* Error State */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-rose-300 flex items-center gap-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <strong className="block text-sm font-bold">Matrix Error</strong>
                <p className="text-xs">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Loading Overlay */}
          <AnimatePresence mode="wait">
            {loading && !result ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl h-[600px]">
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-r-emerald-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-xl animate-pulse">🧠</div>
                  </div>
                  <div>
                    <h3 className="text-emerald-400 text-sm font-black tracking-widest uppercase mb-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">Decomposing AI Matrices</h3>
                    <p className="text-gray-500 text-xs font-medium">Calculating localized Shapley Additive Explanations...</p>
                  </div>
                </div>
              </motion.div>
            ) : result && (
              <motion.div key="results" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} 
                className="space-y-6 w-full relative">
                
                {/* Overlay loading spinner when refreshing existing data */}
                {loading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 rounded-3xl flex items-center justify-center">
                    <div className="bg-white/10 border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 shadow-2xl">
                       <div className="w-5 h-5 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                       <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Recalibrating...</span>
                    </div>
                  </div>
                )}

                {/* ── Top Metric Cards ── */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Base Value */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl text-center flex flex-col justify-center">
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1.5 flex justify-center items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Base Model Value
                    </p>
                    <p className="text-white font-black text-3xl md:text-4xl">{Number(result.base_value).toFixed(1)}</p>
                    <p className="text-gray-500 text-[9px] uppercase mt-2 font-semibold">Pre-Feature Node</p>
                  </div>

                  {/* AI Prediction */}
                  <div className="bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)] text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors" />
                    <p className="text-emerald-400 text-[10px] uppercase font-black tracking-widest mb-1.5 shadow-sm flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                      Final AI Prediction
                    </p>
                    <p className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-teal-200 to-emerald-500 font-black text-5xl md:text-6xl tracking-tighter drop-shadow-lg">
                      {Number(result.prediction).toFixed(1)}
                    </p>
                    <div className="mt-2.5 flex items-center justify-center gap-2">
                       <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${result.prediction > result.base_value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                         {result.prediction > result.base_value ? 'OVER BASE' : 'UNDER BASE'}
                       </span>
                    </div>
                  </div>

                  {/* Target Intel */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl text-center flex flex-col justify-center">
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2 flex justify-center items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                      Lock-on Target
                    </p>
                    <p className="text-white font-extrabold text-xl md:text-2xl truncate">{result.zone || zone}</p>
                    <div className="inline-flex items-center justify-center gap-3 mt-2">
                      <span className="text-amber-400 text-xs font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">Y-{year}</span>
                    </div>
                  </div>
                </div>

                {/* ── Visual Waterfall Chart ── */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <div className="flex justify-between items-end border-b border-white/10 pb-5 mb-6">
                    <div>
                      <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                        Feature Importance Waterfall
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">Magnitudes of individual geometric inputs impacting the output</p>
                    </div>
                    <div className="text-right text-[11px] font-black uppercase tracking-widest bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                      <span className="text-emerald-400 mr-4 inline-flex items-center gap-1"><span className="text-emerald-500/50">▲</span> +{positiveSum.toFixed(2)}</span>
                      <span className="text-rose-400 inline-flex items-center gap-1"><span className="text-rose-500/50">▼</span> -{negativeSum.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="h-[360px] w-full">
                    {waterfall.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={waterfall} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={true} vertical={false} />
                          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={{stroke: 'rgba(255,255,255,0.1)'}} tickLine={false} />
                          <YAxis type="category" dataKey="feature" 
                                 tickFormatter={(val) => formatFeature(val)}
                                 tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 500 }} 
                                 width={160} axisLine={false} tickLine={false} />
                          <ReferenceLine x={0} stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="4 4" />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                          <Bar dataKey="shap_value" radius={6} barSize={24} animationDuration={1500} animationEasing="ease-out">
                            {waterfall.map((entry: any, i: number) => {
                              const isPos = entry.direction === 'positive';
                              return (
                                <Cell key={i} fill={isPos ? '#10b981' : '#f43f5e'} 
                                      className="transition-all duration-300 hover:brightness-125"
                                      style={{ filter: `drop-shadow(0 0 8px ${isPos ? 'rgba(16,185,129,0.6)' : 'rgba(244,63,94,0.6)'})` }}/>
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                        No Shapley data available for this configuration.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Feature Details Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-xl relative group">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay rounded-3xl pointer-events-none" />
                    
                    <h3 className="text-emerald-400 font-black mb-6 tracking-wide text-sm flex items-center gap-3 uppercase">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400">↗</span>
                      </div>
                      Risk Multipliers
                    </h3>
                    
                    <div className="space-y-4">
                      {waterfall.filter((d: any) => d.direction === 'positive').map((d: any, i: number) => (
                        <div key={i} className="flex flex-col gap-1.5 border-b border-emerald-500/10 pb-3 last:border-0 hover:bg-emerald-500/5 p-2 -mx-2 rounded-xl transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-100 text-xs font-bold flex items-center gap-2">
                              <span>{FEATURE_META[d.feature]?.icon || '📊'}</span> 
                              {formatFeature(d.feature)}
                            </span>
                            <span className="text-emerald-400 text-sm font-mono font-black drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                              +{d.shap_value.toFixed(4)}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (d.shap_value / Math.max(...waterfall.map((w:any) => Math.abs(w.shap_value)))) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                      {waterfall.filter((d: any) => d.direction === 'positive').length === 0 && (
                        <p className="text-emerald-500/50 text-xs italic">No positive drivers found.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-rose-500/10 to-rose-900/5 border border-rose-500/20 rounded-3xl p-6 md:p-8 shadow-xl relative group">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay rounded-3xl pointer-events-none" />
                    
                    <h3 className="text-rose-400 font-black mb-6 tracking-wide text-sm flex items-center gap-3 uppercase">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <span className="text-rose-400">↘</span>
                      </div>
                      Risk Mitigators
                    </h3>
                    
                    <div className="space-y-4">
                      {waterfall.filter((d: any) => d.direction === 'non-existent' || d.direction === 'negative').map((d: any, i: number) => (
                        <div key={i} className="flex flex-col gap-1.5 border-b border-rose-500/10 pb-3 last:border-0 hover:bg-rose-500/5 p-2 -mx-2 rounded-xl transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-rose-100 text-xs font-bold flex items-center gap-2">
                              <span>{FEATURE_META[d.feature]?.icon || '📊'}</span> 
                              {formatFeature(d.feature)}
                            </span>
                            <span className="text-rose-400 text-sm font-mono font-black drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">
                              {d.shap_value.toFixed(4)}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden flex justify-end">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (Math.abs(d.shap_value) / Math.max(...waterfall.map((w:any) => Math.abs(w.shap_value)))) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                      {waterfall.filter((d: any) => d.direction === 'non-existent' || d.direction === 'negative').length === 0 && (
                        <p className="text-rose-500/50 text-xs italic">No negative drivers found.</p>
                      )}
                    </div>
                  </div>
                </div>
                
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
