'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_SUSTAINABILITY_API || '';

const VARIABLES = [
  { key: 'solar_increase',     label: '☀ Solar',           color: '#f59e0b', unit: 'intensity' },
  { key: 'waste_improvement',  label: '♻ Waste',           color: '#22c55e', unit: 'intensity' },
  { key: 'green_expansion',    label: '🌳 Green',           color: '#10b981', unit: 'intensity' },
  { key: 'water_conservation', label: '💧 Water Conservation', color: '#06b6d4', unit: 'intensity' },
  { key: 'ev_adoption',        label: '🚗 EV Adoption',    color: '#8b5cf6', unit: 'intensity' },
  { key: 'public_transport',   label: '🚌 Public Transit', color: '#ec4899', unit: 'intensity' },
];

const COST_MAP: Record<string,number> = {
  solar_increase:500, waste_improvement:300, green_expansion:200,
  water_conservation:150, ev_adoption:400, public_transport:250,
};

export default function OptimizationPage() {
  const [budget, setBudget]   = useState(1500);
  const [ghgTarget, setGhgTarget] = useState(5.0);
  const [scoreTarget, setScoreTarget] = useState(10.0);
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paretoData, setParetoData] = useState<any[]>([]);
  const [paretoLoading, setParetoLoading] = useState(false);
  const [tab, setTab]         = useState<'optimizer'|'pareto'>('optimizer');

  const runOptimization = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/optimization/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_cr: budget,
          target_ghg_reduction: ghgTarget,
          min_score_lift: scoreTarget,
        }),
      });
      if (r.ok) setResult(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadPareto = async () => {
    setParetoLoading(true);
    try {
      const r = await fetch(`${API}/api/optimization/pareto?budget_cr=${budget}&steps=8`);
      if (r.ok) {
        const d = await r.json();
        setParetoData(d.pareto_points || []);
      }
    } catch(e) { console.error(e); }
    finally { setParetoLoading(false); }
  };

  const chartData = result
    ? VARIABLES.map(v => ({
        name: v.label.split(' ').slice(1).join(' ') || v.label,
        allocated: Math.round((result.optimal_mix?.[v.key] || 0) * 100),
        color: v.color,
      }))
    : [];

  const radarData = result?.priority_ranking?.map((p: any) => ({
    action: VARIABLES.find(v => v.key === p.action)?.label || p.action,
    efficiency: Math.round(p.efficiency * 10),
    allocated: Math.round(p.allocated * 100),
  })) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">⚡ Optimization Engine</h1>
        <p className="text-gray-400 text-sm mt-1">Linear Programming finds the optimal sustainability policy mix for your budget</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['optimizer','pareto'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==='pareto' && !paretoData.length) loadPareto(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?'bg-violet-600 text-white':'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>
            {t === 'optimizer' ? '🎯 LP Optimizer' : '📈 Pareto Frontier'}
          </button>
        ))}
      </div>

      {tab === 'optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-5 bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg">Constraints</h2>

            <div>
              <label className="text-gray-400 text-sm">Total Budget (₹ Crore)</label>
              <input type="range" min={200} max={5000} step={100} value={budget}
                onChange={e => setBudget(+e.target.value)}
                className="w-full accent-violet-500 mt-2"/>
              <p className="text-violet-400 font-bold text-xl">₹ {budget.toLocaleString()} Cr</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Min GHG Reduction (MtCO₂/yr)</label>
              <input type="range" min={0} max={15} step={0.5} value={ghgTarget}
                onChange={e => setGhgTarget(+e.target.value)}
                className="w-full accent-emerald-500 mt-2"/>
              <p className="text-emerald-400 font-bold text-xl">{ghgTarget} MtCO₂</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Min Score Lift (points)</label>
              <input type="range" min={0} max={35} step={1} value={scoreTarget}
                onChange={e => setScoreTarget(+e.target.value)}
                className="w-full accent-cyan-500 mt-2"/>
              <p className="text-cyan-400 font-bold text-xl">+{scoreTarget} pts</p>
            </div>

            <button onClick={runOptimization} disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 transition-all">
              {loading ? '⏳ Optimizing…' : '🚀 Optimize Now'}
            </button>

            {result && (
              <div className={`text-xs px-3 py-2 rounded-lg ${result.status==='Optimal'?'bg-emerald-500/20 text-emerald-400':'bg-amber-500/20 text-amber-400'}`}>
                Solver: {result.status}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'GHG Reduction', value: `${result.projected_impact?.ghg_reduction_mtco2} MtCO₂`, color: 'text-emerald-400' },
                    { label: 'Score Lift',    value: `+${result.projected_impact?.score_lift_points} pts`,   color: 'text-cyan-400' },
                    { label: 'Total Cost',    value: `₹${result.projected_impact?.total_cost_cr?.toLocaleString()} Cr`, color: 'text-violet-400' },
                    { label: 'ROI',           value: `${result.projected_impact?.roi_percent}%`,              color: 'text-amber-400' },
                  ].map(k => (
                    <div key={k.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                      <p className="text-gray-400 text-xs mb-1">{k.label}</p>
                      <p className={`${k.color} font-bold text-lg`}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Optimal mix bar chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                  <h3 className="text-white font-semibold mb-4">Optimal Policy Mix (% of max investment)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
                      <XAxis type="number" domain={[0,100]} tick={{fill:'#94a3b8', fontSize:11}} unit="%"/>
                      <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8', fontSize:11}} width={100}/>
                      <Tooltip formatter={(v:any) => [`${v}%`, 'Allocated']}
                        contentStyle={{backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'8px'}}/>
                      <Bar dataKey="allocated" radius={4}>
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority ranking */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                  <h3 className="text-white font-semibold mb-4">Priority Ranking (by cost-efficiency)</h3>
                  <div className="space-y-2">
                    {result.priority_ranking?.map((p: any, i: number) => {
                      const meta = VARIABLES.find(v => v.key === p.action);
                      const pct = Math.round(p.allocated * 100);
                      return (
                        <div key={p.action} className="flex items-center gap-3">
                          <span className="text-gray-500 text-sm w-4">{i+1}.</span>
                          <span className="text-white text-sm w-40">{meta?.label || p.action}</span>
                          <div className="flex-1 bg-slate-700 rounded-full h-2 relative overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000"
                              style={{width:`${pct}%`, backgroundColor: meta?.color || '#64748b'}}/>
                          </div>
                          <span className="text-gray-300 text-xs w-12 text-right">{pct}%</span>
                          <span className="text-gray-500 text-xs w-24 text-right">eff: {p.efficiency?.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 bg-slate-800 border border-slate-700 rounded-2xl">
                <div className="text-center text-gray-500">
                  <p className="text-4xl mb-3">⚡</p>
                  <p>Set constraints and click Optimize Now</p>
                  <p className="text-xs mt-1">LP solver will find the optimal policy mix</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'pareto' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Score Lift vs Budget Trade-off</h2>
          {paretoLoading && <p className="text-gray-400">Computing Pareto frontier…</p>}
          {paretoData.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="budget_cr" tick={{fill:'#94a3b8',fontSize:11}} label={{value:'Budget (₹ Cr)',position:'insideBottom',offset:-5,fill:'#94a3b8'}}/>
                  <YAxis yAxisId="left" tick={{fill:'#94a3b8',fontSize:11}} label={{value:'Score Lift',angle:-90,position:'insideLeft',fill:'#94a3b8'}}/>
                  <YAxis yAxisId="right" orientation="right" tick={{fill:'#94a3b8',fontSize:11}} label={{value:'GHG Reduction',angle:90,position:'insideRight',fill:'#94a3b8'}}/>
                  <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155',borderRadius:'8px'}}/>
                  <Legend/>
                  <Bar yAxisId="left" dataKey="score_lift" name="Score Lift (pts)" fill="#8b5cf6" radius={4}/>
                  <Bar yAxisId="right" dataKey="ghg_reduction" name="GHG Reduction (MtCO₂)" fill="#22c55e" radius={4}/>
                </BarChart>
              </ResponsiveContainer>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-gray-300">
                  <thead><tr className="border-b border-slate-700 text-gray-500">
                    <th className="py-2 text-left">Budget (₹ Cr)</th>
                    <th>Score Lift</th><th>GHG Reduction</th>
                  </tr></thead>
                  <tbody>
                    {paretoData.map((p,i) => (
                      <tr key={i} className="border-b border-slate-800">
                        <td className="py-2">₹{p.budget_cr?.toLocaleString()}</td>
                        <td className="text-center text-cyan-400">+{p.score_lift}</td>
                        <td className="text-center text-emerald-400">{p.ghg_reduction} Mt</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
