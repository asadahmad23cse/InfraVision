'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { getOptimizationPareto, optimizePolicy, type OptimizationUiResponse, type ParetoPoint } from '@/lib/sustainabilityApi';

const VARIABLES: Array<{ key: 'solar' | 'waste' | 'ev'; label: string; color: string }> = [
  { key: 'solar', label: 'Solar & Renewable', color: '#38bdf8' },
  { key: 'waste', label: 'Waste Management', color: '#a78bfa' },
  { key: 'ev',    label: 'EV & Transit',     color: '#f472b6' },
];

export default function OptimizationPage() {
  const [budget, setBudget]   = useState(1500);
  const [ghgTarget, setGhgTarget] = useState(5.0);
  const [scoreTarget, setScoreTarget] = useState(10.0);
  const [result, setResult]   = useState<OptimizationUiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string|null>(null);
  
  const [paretoData, setParetoData] = useState<ParetoPoint[]>([]);
  const [paretoLoading, setParetoLoading] = useState(false);
  const [tab, setTab]         = useState<'optimizer'|'pareto'>('optimizer');

  const runOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await optimizePolicy({
        budget_cr: budget,
        target_ghg_reduction: ghgTarget,
        min_score_lift: scoreTarget,
      });
      setResult(data);
      if (data.status === "fallback") {
        setError("Constraints too strict. Showing best achievable solution.");
      }
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Optimization failed.');
      setResult(null);
    } finally { 
      setLoading(false); 
    }
  };

  const loadPareto = async () => {
    setParetoLoading(true);
    try {
      const d = await getOptimizationPareto(budget, 8);
      setParetoData(d.pareto_points || []);
    } catch(e) { console.error(e); }
    finally { setParetoLoading(false); }
  };

  const chartData = result
    ? VARIABLES.map(v => ({
        name: v.label,
        allocated: Math.round(result[v.key] || 0),
        color: v.color,
      }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3 text-violet-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          ✨ AI-Powered LP Solver
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-gray-400 tracking-tight">
          Optimization Engine
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Translate sustainability targets into exact mathematical allocations. Give the engine your budget constraints, and it maximizes impact using Linear Programming.
        </p>
      </motion.div>

      <div className="flex gap-3 mb-8">
        {(['optimizer','pareto'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==='pareto' && !paretoData.length) loadPareto(); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${tab===t?'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20':'bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
            {t === 'optimizer' ? '🎯 Policy Simulator' : '📈 Pareto Frontier'}
          </button>
        ))}
      </div>

      {tab === 'optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls - Premium Glass Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-4 space-y-7 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none"></div>
            
            <h2 className="text-white font-bold text-lg tracking-wide border-b border-white/10 pb-4">Engine Constraints</h2>

            <div className="space-y-6">
              <div className="group/slider">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total CapEx (₹ Cr)</label>
                  <p className="text-violet-400 font-black text-xl tracking-tight">₹{budget.toLocaleString()}</p>
                </div>
                <input type="range" min={200} max={5000} step={100} value={budget}
                  onChange={e => setBudget(+e.target.value)}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"/>
              </div>

              <div className="group/slider">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Min GHG Cut (MtCO₂)</label>
                  <p className="text-emerald-400 font-black text-xl tracking-tight">{ghgTarget} Mt</p>
                </div>
                <input type="range" min={0} max={15} step={0.5} value={ghgTarget}
                  onChange={e => setGhgTarget(+e.target.value)}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"/>
              </div>

              <div className="group/slider">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Target Score Lift</label>
                  <p className="text-cyan-400 font-black text-xl tracking-tight">+{scoreTarget}</p>
                </div>
                <input type="range" min={0} max={35} step={1} value={scoreTarget}
                  onChange={e => setScoreTarget(+e.target.value)}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"/>
              </div>
            </div>

            <button onClick={runOptimization} disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all duration-300 transform active:scale-95 bg-[length:200%_auto] hover:bg-right">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Solving Matrix...
                </span>
              ) : 'Run LP Optimizer'}
            </button>
            
            {error && (
              <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs leading-relaxed">
                <strong className="block mb-1">Solver Constraints Infeasible</strong>
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Results Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!result && !loading && !error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500/20 to-transparent rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                    <span className="text-3xl opacity-50">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">Awaiting Parameters</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">Configure your CapEx and climate constraints to compute the mathematically perfect sustainability strategy.</p>
                </div>
              </motion.div>
            )}

            {loading && (
              <div className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-primary animate-spin border-violet-500"></div>
                  <p className="text-violet-400 text-sm font-semibold tracking-widest uppercase animate-pulse">Running Simplex Algorithm...</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                
                {/* KPI Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Target Score',  value: `${Number(result.optimal_score || 0).toFixed(2)}`,   color: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/20' },
                    { label: 'Score Lift',    value: `+${Number(result.score || 0).toFixed(2)}`, color: 'from-sky-400 to-indigo-500', glow: 'shadow-sky-500/20' },
                    { label: 'GHG Reduction', value: `${Number(result.ghg_reduction || 0).toFixed(2)}Mt`, color: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/20' },
                    { label: 'Actual CapEx',  value: `₹${Number(result.cost || 0).toLocaleString()}`, color: 'from-violet-400 to-purple-500', glow: 'shadow-violet-500/20' },
                  ].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 * i }}
                      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:scale-[1.03] transition-transform group relative overflow-hidden`}>
                      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${k.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2">{k.label}</p>
                      <p className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br ${k.color}`}>{k.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Main Chart */}
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.4 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h3 className="text-white font-bold tracking-wide">Optimal Capital Deployment Map</h3>
                    <span className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg tracking-widest uppercase font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">Solution Confirmed</span>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                        <XAxis type="number" domain={[0,100]} tick={{fill:'#64748b', fontSize:11, fontWeight:600}} unit="%"/>
                        <YAxis type="category" dataKey="name" tick={{fill:'#cbd5e1', fontSize:12, fontWeight:500}} width={120} axisLine={false} tickLine={false}/>
                        <Tooltip 
                          cursor={{fill: 'rgba(255,255,255,0.02)'}}
                          contentStyle={{backgroundColor:'rgba(15, 23, 42, 0.9)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff', boxShadow:'0 10px 25px -5px rgba(0, 0, 0, 0.5)'}}
                          itemStyle={{color: '#fff', fontWeight: 700}}
                        />
                        <Bar dataKey="allocated" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}40)` }}/>
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Pareto tab styling omitted for brevity in this task, but maintaining component structure */}
      {tab === 'pareto' && (
        <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-6 tracking-wide">Score vs Budget Trade-off Frontier</h2>
          {paretoLoading && <div className="text-center py-20 text-violet-400 animate-pulse text-sm font-bold tracking-widest uppercase">Computing Frontier Matrix...</div>}
          {paretoData.length > 0 && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="budget_cr" tick={{fill:'#64748b'}} />
                  <YAxis yAxisId="left" tick={{fill:'#64748b'}}/>
                  <YAxis yAxisId="right" orientation="right" tick={{fill:'#64748b'}}/>
                  <Tooltip contentStyle={{backgroundColor:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px'}}/>
                  <Bar yAxisId="left" dataKey="score_lift" fill="#8b5cf6" radius={[4,4,0,0]}/>
                  <Bar yAxisId="right" dataKey="ghg_reduction" fill="#10b981" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
