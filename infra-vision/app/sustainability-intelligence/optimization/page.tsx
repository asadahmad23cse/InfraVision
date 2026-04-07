'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  getOptimizationPareto, optimizePolicy,
  type OptimizationUiResponse, type ParetoPoint,
} from '@/lib/sustainabilityApi';

// ── Sector metadata ─────────────────────────────────────────────────────────
const META: Record<string, { icon: string; color: string; sector: string; glow: string }> = {
  solar_increase:     { icon: '☀️', color: '#f59e0b', sector: 'Energy',            glow: 'rgba(245,158,11,0.35)'  },
  waste_improvement:  { icon: '♻️', color: '#a78bfa', sector: 'Circular Economy',  glow: 'rgba(167,139,250,0.35)' },
  green_expansion:    { icon: '🌳', color: '#34d399', sector: 'Environment',        glow: 'rgba(52,211,153,0.35)'  },
  water_conservation: { icon: '💧', color: '#38bdf8', sector: 'Water Resources',   glow: 'rgba(56,189,248,0.35)'  },
  ev_adoption:        { icon: '⚡', color: '#f472b6', sector: 'Clean Mobility',     glow: 'rgba(244,114,182,0.35)' },
  public_transport:   { icon: '🚊', color: '#fb923c', sector: 'Urban Mobility',     glow: 'rgba(251,146,60,0.35)'  },
};

// ── Custom tooltip ───────────────────────────────────────────────────────────
function DeploymentTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; icon: string; capex: number; score: number; ghg: number; pct: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[210px]">
      <p className="text-white font-bold text-sm mb-3">{d.icon} {d.name}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-6"><span className="text-gray-400">Capital Deployed</span><span className="text-violet-300 font-bold">₹{Number(d.capex).toLocaleString()} Cr</span></div>
        <div className="flex justify-between gap-6"><span className="text-gray-400">Budget Share</span><span className="text-amber-300 font-bold">{d.pct.toFixed(1)}%</span></div>
        <div className="flex justify-between gap-6"><span className="text-gray-400">Score Contribution</span><span className="text-cyan-300 font-bold">+{Number(d.score).toFixed(2)} pts</span></div>
        <div className="flex justify-between gap-6"><span className="text-gray-400">GHG Reduction</span><span className="text-emerald-300 font-bold">{Number(d.ghg).toFixed(2)} MtCO₂</span></div>
      </div>
    </div>
  );
}

export default function OptimizationPage() {
  const [budget, setBudget]         = useState(1500);
  const [ghgTarget, setGhgTarget]   = useState(5.0);
  const [scoreTarget, setScoreTarget] = useState(10.0);
  const [result, setResult]         = useState<OptimizationUiResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [paretoData, setParetoData] = useState<ParetoPoint[]>([]);
  const [paretoLoading, setParetoLoading] = useState(false);
  const [tab, setTab]               = useState<'optimizer' | 'pareto'>('optimizer');

  const runOptimization = async () => {
    setLoading(true); setError(null);
    try {
      const data = await optimizePolicy({ budget_cr: budget, target_ghg_reduction: ghgTarget, min_score_lift: scoreTarget });
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Optimization failed.');
      setResult(null);
    } finally { setLoading(false); }
  };

  const loadPareto = async () => {
    setParetoLoading(true);
    try { const d = await getOptimizationPareto(budget, 8); setParetoData(d.pareto_points || []); }
    catch (e) { console.error(e); }
    finally { setParetoLoading(false); }
  };

  const isPartial = result?.status === 'partial' || result?.status === 'fallback';

  // Build chart from breakdown (all funded interventions sorted by capex desc)
  const chartData = [...(result?.breakdown ?? [])]
    .sort((a, b) => b.capex_cr - a.capex_cr)
    .map(b => ({
      name: b.label,
      icon: META[b.key]?.icon ?? '📊',
      capex: b.capex_cr,
      score: b.score_lift,
      ghg: b.ghg_reduction,
      color: META[b.key]?.color ?? '#8b5cf6',
      glow: META[b.key]?.glow ?? 'rgba(139,92,246,0.3)',
      pct: budget > 0 ? (b.capex_cr / budget) * 100 : 0,
    }));

  const breakdownSorted = [...(result?.breakdown ?? [])].sort((a, b) => b.capex_cr - a.capex_cr);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3 text-violet-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          ✨ AI-Powered LP Solver
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-gray-400 tracking-tight">
          Optimization Engine
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Translate sustainability targets into exact mathematical allocations using Linear Programming — real-world capital deployment across 6 sectors.
        </p>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-3 mb-8">
        {(['optimizer', 'pareto'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'pareto' && !paretoData.length) loadPareto(); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${tab === t ? 'bg-white/10 text-white ring-1 ring-white/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
            {t === 'optimizer' ? '🎯 Policy Simulator' : '📈 Pareto Frontier'}
          </button>
        ))}
      </div>

      {tab === 'optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Controls Panel ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-4 self-start bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl space-y-7 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <h2 className="text-white font-bold text-lg tracking-wide border-b border-white/10 pb-4">Engine Constraints</h2>

            {/* Sliders */}
            {[
              { label: 'Total CapEx (₹ Cr)', val: budget,      set: setBudget,      min: 200,  max: 5000, step: 100, color: 'accent-violet-500', display: `₹${budget.toLocaleString()}`,  textColor: 'text-violet-400',  min_lbl: '₹200 Cr',   max_lbl: '₹5,000 Cr' },
              { label: 'Min GHG Cut (MtCO₂)',val: ghgTarget,   set: setGhgTarget,   min: 0,    max: 15,   step: 0.5, color: 'accent-emerald-500',display: `${ghgTarget} Mt`,              textColor: 'text-emerald-400', min_lbl: '0 Mt',      max_lbl: '15 Mt'      },
              { label: 'Target Score Lift',  val: scoreTarget, set: setScoreTarget, min: 0,    max: 35,   step: 1,   color: 'accent-cyan-500',   display: `+${scoreTarget}`,              textColor: 'text-cyan-400',    min_lbl: '0 pts',     max_lbl: '35 pts'     },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">{s.label}</label>
                  <p className={`${s.textColor} font-black text-xl tracking-tight`}>{s.display}</p>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                  onChange={e => s.set(+e.target.value)}
                  className={`w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer ${s.color}`} />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>{s.min_lbl}</span><span>{s.max_lbl}</span>
                </div>
              </div>
            ))}

            <button onClick={runOptimization} disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all duration-300 active:scale-95">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Solving Matrix...
                </span>
              ) : 'Run LP Optimizer'}
            </button>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs leading-relaxed">
                <strong className="block mb-1">⚠ Solver Error</strong>{error}
              </motion.div>
            )}
            {result && isPartial && !error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs leading-relaxed">
                <strong className="block mb-1">💡 Best Achievable Allocation</strong>
                Budget limits reached for stated targets. Showing the most efficient capital deployment within constraints.
              </motion.div>
            )}
          </motion.div>

          {/* ── Results Area ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Empty state */}
            {!result && !loading && !error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-16 shadow-2xl">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500/20 to-transparent rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                    <span className="text-3xl opacity-50">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Awaiting Parameters</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">Configure CapEx and climate constraints to compute the mathematically optimal sustainability strategy across 6 sectors.</p>
                </div>
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-violet-500 animate-spin" />
                  <p className="text-violet-400 text-sm font-semibold tracking-widest uppercase animate-pulse">Running Simplex Algorithm...</p>
                </div>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">

                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Optimal Score',  value: `${Number(result.optimal_score || 0).toFixed(1)}`,    gradient: 'from-cyan-400 to-blue-500'    },
                    { label: 'Score Lift',     value: `+${Number(result.score || 0).toFixed(1)} pts`,        gradient: 'from-sky-400 to-indigo-500'   },
                    { label: 'GHG Reduction',  value: `${Number(result.ghg_reduction || 0).toFixed(2)} Mt`,  gradient: 'from-emerald-400 to-teal-500' },
                    { label: 'Actual CapEx',   value: `₹${Number(result.cost || 0).toLocaleString()} Cr`,   gradient: 'from-violet-400 to-purple-500' },
                  ].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:scale-[1.03] transition-transform relative overflow-hidden group">
                      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${k.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2">{k.label}</p>
                      <p className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br ${k.gradient}`}>{k.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* ── Capital Deployment Map ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
                  <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-5">
                    <div>
                      <h3 className="text-white font-bold text-base tracking-wide">Optimal Capital Deployment Map</h3>
                      <p className="text-gray-500 text-xs mt-1">LP-solved allocation across 6 sustainability sectors · ₹ Crore</p>
                    </div>
                    <span className={`text-[10px] px-3 py-1.5 border rounded-lg tracking-widest uppercase font-bold ${isPartial ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {isPartial ? '⚡ Best Achievable' : '✓ Solution Confirmed'}
                    </span>
                  </div>

                  {chartData.filter(d => d.capex > 0).length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.filter(d => d.capex > 0)} layout="vertical" margin={{ left: 10, right: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                          <XAxis type="number" domain={[0, budget]} tick={{ fill: '#64748b', fontSize: 11 }}
                            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} width={145} axisLine={false} tickLine={false} />
                          <Tooltip content={<DeploymentTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                          <Bar dataKey="capex" radius={[0, 8, 8, 0]} barSize={26} animationDuration={1200}>
                            {chartData.filter(d => d.capex > 0).map((e, i) => (
                              <Cell key={i} fill={e.color} style={{ filter: `drop-shadow(0 0 10px ${e.glow})` }} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                      No capital allocated — budget may be too low for the specified targets.
                    </div>
                  )}
                </motion.div>

                {/* ── Intervention Priority Matrix ── */}
                {breakdownSorted.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
                    <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-4">
                      <div>
                        <h3 className="text-white font-bold text-base tracking-wide">Intervention Priority Matrix</h3>
                        <p className="text-gray-500 text-xs mt-1">Ranked by LP-optimal capital deployment</p>
                      </div>
                      <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono">
                        6 interventions · ₹{Number(result.cost || 0).toLocaleString()} Cr total
                      </span>
                    </div>

                    <div className="space-y-3">
                      {breakdownSorted.map((item, i) => {
                        const m = META[item.key] ?? { icon: '📊', color: '#8b5cf6', sector: 'Other', glow: 'rgba(139,92,246,0.3)' };
                        const pct = budget > 0 ? (item.capex_cr / budget) * 100 : 0;
                        const funded = item.capex_cr > 0;
                        const badge = item.capex_cr > budget * 0.3 ? { label: 'Primary',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' }
                               : item.capex_cr > 0                ? { label: 'Secondary', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' }
                               :                                    { label: 'Unfunded',  cls: 'bg-gray-800 text-gray-500 border-gray-700' };
                        return (
                          <motion.div key={item.key}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-all group">

                            {/* Rank */}
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${funded ? 'text-white' : 'text-gray-600'}`}
                              style={{ background: funded ? `${m.color}25` : '#1e293b', border: `1px solid ${funded ? m.color + '40' : '#334155'}` }}>
                              {i + 1}
                            </div>

                            {/* Icon + label */}
                            <div className="flex items-center gap-2.5 w-44 shrink-0">
                              <span className={`text-xl transition-transform group-hover:scale-110 ${!funded ? 'grayscale opacity-40' : ''}`}>{m.icon}</span>
                              <div>
                                <p className={`text-sm font-semibold ${funded ? 'text-white' : 'text-gray-500'}`}>{item.label}</p>
                                <p className="text-[10px] text-gray-600">{m.sector}</p>
                              </div>
                            </div>

                            {/* Capital progress bar */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-gray-400 font-mono">₹{item.capex_cr.toLocaleString()} Cr</span>
                                <span className="font-bold" style={{ color: funded ? m.color : '#475569' }}>{pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-gray-800/80 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.1 + i * 0.06, duration: 0.9, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: m.color, boxShadow: funded ? `0 0 10px ${m.glow}` : 'none' }}
                                />
                              </div>
                            </div>

                            {/* Score */}
                            <div className="text-center w-18 shrink-0">
                              <p className={`text-sm font-bold ${funded ? 'text-cyan-400' : 'text-gray-600'}`}>+{item.score_lift.toFixed(1)}</p>
                              <p className="text-[10px] text-gray-600">Score</p>
                            </div>

                            {/* GHG */}
                            <div className="text-center w-16 shrink-0">
                              <p className={`text-sm font-bold ${funded ? 'text-emerald-400' : 'text-gray-600'}`}>{item.ghg_reduction.toFixed(2)}</p>
                              <p className="text-[10px] text-gray-600">MtCO₂</p>
                            </div>

                            {/* Badge */}
                            <span className={`shrink-0 text-[9px] px-2 py-1 rounded-lg border font-bold uppercase tracking-widest ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* ROI Summary Footer */}
                    <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
                      {[
                        { label: 'Funded Sectors', value: String(breakdownSorted.filter(b => b.capex_cr > 0).length) + ' / 6', color: 'text-violet-400' },
                        { label: 'Avg Score / ₹100Cr', value: `+${result.cost > 0 ? ((result.score / result.cost) * 100).toFixed(2) : '0'} pts`, color: 'text-cyan-400' },
                        { label: 'GHG Efficiency', value: `${result.cost > 0 ? (result.ghg_reduction / result.cost * 1000).toFixed(2) : '0'} kt/₹Cr`, color: 'text-emerald-400' },
                      ].map(s => (
                        <div key={s.label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ── Pareto Tab ── */}
      {tab === 'pareto' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-2 tracking-wide">Score vs Budget Trade-off Frontier</h2>
          <p className="text-gray-500 text-xs mb-6">How sustainability score lift and GHG reduction change as budget increases</p>
          {paretoLoading && <div className="text-center py-20 text-violet-400 animate-pulse text-sm font-bold tracking-widest uppercase">Computing Frontier Matrix...</div>}
          {paretoData.length > 0 && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="budget_cr" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Bar yAxisId="left"  dataKey="score_lift"    fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Score Lift" />
                  <Bar yAxisId="right" dataKey="ghg_reduction" fill="#10b981" radius={[4, 4, 0, 0]} name="GHG Reduction (Mt)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
