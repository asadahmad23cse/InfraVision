'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const ZONES = ["North","South","East","West","Central","North-East","North-West","South-West","South-East"];
const API    = process.env.NEXT_PUBLIC_SUSTAINABILITY_API || '';

export default function ExplainabilityPage() {
  const [zone,  setZone]   = useState('North');
  const [year,  setYear]   = useState(2022);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/ml/explain?zone=${encodeURIComponent(zone)}&year=${year}`);
      if (r.ok) setResult(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const waterfall = result?.waterfall || [];
  const top5 = waterfall.slice(0, 10);

  const positiveSum = waterfall.filter((f:any) => f.shap_value > 0).reduce((s:number, f:any) => s + f.shap_value, 0);
  const negativeSum = waterfall.filter((f:any) => f.shap_value < 0).reduce((s:number, f:any) => s + Math.abs(f.shap_value), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3 text-emerald-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          🧠 Explainable AI Core
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-gray-400 tracking-tight">
          Algorithm Transparency (SHAP)
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Open the black box. SHAP (SHapley Additive exPlanations) values decompose exactly why the machine learning models assigned a specific risk score to any geographic zone.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls - Premium Glass Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-4 space-y-7 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none"></div>
          
          <h2 className="text-white font-bold text-lg tracking-wide border-b border-white/10 pb-4">Inference Parameters</h2>

          <div className="space-y-6">
            <div className="group/dropdown">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">Target Zone</label>
              <div className="relative">
                <select value={zone} onChange={e => setZone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium appearance-none outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner">
                  {ZONES.map(z => <option key={z} value={z} className="bg-gray-900">{z}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>

            <div className="group/dropdown">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">Temporal Index</label>
              <div className="relative">
                <select value={year} onChange={e => setYear(+e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium appearance-none outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner">
                  {Array.from({length:8}, (_,i) => 2015+i).map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>
          </div>

          <button onClick={explain} disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all duration-300 transform active:scale-95 bg-[length:200%_auto] hover:bg-right">
            {loading ? '⏳ Computing Shapley Values...' : '🧠 Explain Prediction'}
          </button>

          {/* Model info snippet */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mb-3">How to read this</p>
            <div className="space-y-3 text-xs text-gray-400 leading-relaxed font-medium">
              <p className="flex items-start gap-2"><span className="text-emerald-400">↗</span> Green features mathematically push the risk assessment higher.</p>
              <p className="flex items-start gap-2"><span className="text-red-400">↘</span> Red features mitigate the score, pulling risk lower.</p>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                  <span className="text-3xl opacity-50">🧠</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">Awaiting Target Selection</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Select a geographic zone and temporal index to peek inside the decision-making engine.</p>
              </div>
            </motion.div>
          )}

          {loading && (
             <div className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin"></div>
                <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase animate-pulse">Decomposing AI Matrices...</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              
              {/* Prediction summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl text-center">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Base Value (Avg Node)</p>
                  <p className="text-white font-black text-3xl">{result.base_value}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors"></div>
                  <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest mb-1 shadow-sm">AI Computed Risk Score</p>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-black text-4xl">{result.prediction}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl text-center">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Processed Node</p>
                  <p className="text-white font-bold text-lg">{result.zone || zone}</p>
                  <p className="text-gray-400 text-xs font-mono">{year}</p>
                </div>
              </div>

              {/* SHAP waterfall chart */}
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
                  <div>
                    <h3 className="text-white font-bold tracking-wide">SHAP Weight Waterfall</h3>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mt-1">Top 10 Feature Contributions</p>
                  </div>
                  <div className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="text-emerald-400 mr-3">+{positiveSum.toFixed(3)} (Δ)</span>
                    <span className="text-red-400">-{negativeSum.toFixed(3)} (Δ)</span>
                  </div>
                </div>
                
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top5} layout="vertical" margin={{left: 20, right: 30}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                      <XAxis type="number" tick={{fill:'#64748b', fontSize:11, fontWeight:600}} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="feature" tick={{fill:'#cbd5e1', fontSize:11, fontWeight:500}} width={140} axisLine={false} tickLine={false}/>
                      <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" strokeWidth={2}/>
                      <Tooltip formatter={(v: any) => [v.toFixed(4), 'SHAP Impact']}
                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                        contentStyle={{backgroundColor:'rgba(15, 23, 42, 0.9)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff', boxShadow:'0 10px 25px -5px rgba(0, 0, 0, 0.5)'}}
                        itemStyle={{fontWeight: 700}}/>
                      <Bar dataKey="shap_value" radius={4} barSize={20} animationDuration={1000}>
                        {top5.map((entry: any, i: number) => {
                          const isPos = entry.direction === 'positive';
                          return (
                            <Cell key={i} fill={isPos ? '#10b981' : '#ef4444'} 
                                  style={{ filter: `drop-shadow(0 0 6px ${isPos ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'})` }}/>
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:bg-emerald-500/10 transition-colors">
                  <h3 className="text-emerald-400 font-bold mb-4 tracking-wide text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Risk Multipliers
                  </h3>
                  <div className="space-y-3">
                    {(result.top_positive_drivers || []).map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-300 text-xs font-bold">{d.feature.replace(/_/g,' ')}</span>
                        <span className="text-emerald-400 text-sm font-mono font-black drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]">+{d.shap.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:bg-red-500/10 transition-colors">
                  <h3 className="text-red-400 font-bold mb-4 tracking-wide text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> Risk Mitigators
                  </h3>
                  <div className="space-y-3">
                    {(result.top_negative_drivers || []).map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-300 text-xs font-bold">{d.feature.replace(/_/g,' ')}</span>
                        <span className="text-red-400 text-sm font-mono font-black drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]">{d.shap.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
