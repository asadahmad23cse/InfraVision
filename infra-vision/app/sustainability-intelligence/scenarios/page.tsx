'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_SUSTAINABILITY_API || '';

const SCENARIO_COLORS = ['#cbd5e1', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];

const PRESET_SCENARIOS = [
  {
    label: 'Baseline (Do Nothing)',
    description: 'Current trajectory with no extra intervention',
    interventions: { solar_increase: 0.1, ev_adoption: 0.1, public_transport: 0.1,
                     waste_improvement: 0.1, green_expansion: 0.1, water_conservation: 0.1 },
  },
  {
    label: 'Solar Push',
    description: 'Heavy investment in rooftop solar and renewable energy',
    interventions: { solar_increase: 0.9, ev_adoption: 0.5, public_transport: 0.3,
                     waste_improvement: 0.1, green_expansion: 0.1, water_conservation: 0.1 },
  },
  {
    label: 'Green City',
    description: 'Focus on green space, water conservation, and waste management',
    interventions: { green_expansion: 0.9, water_conservation: 0.8, waste_improvement: 0.7,
                     solar_increase: 0.2, ev_adoption: 0.2, public_transport: 0.2 },
  },
  {
    label: 'Mobility Revolution',
    description: 'Aggressive EV adoption and public transport expansion',
    interventions: { ev_adoption: 0.9, public_transport: 0.8, solar_increase: 0.5,
                     waste_improvement: 0.2, green_expansion: 0.1, water_conservation: 0.1 },
  },
  {
    label: 'Balanced Growth',
    description: 'Balanced moderate investment across all dimensions',
    interventions: { solar_increase: 0.5, waste_improvement: 0.5, green_expansion: 0.5,
                     water_conservation: 0.5, ev_adoption: 0.4, public_transport: 0.4 },
  },
];

function processTimeseries(scenarios: any[]): { metric: string; data: any[] }[] {
  if (!scenarios?.length) return [];
  const years = Object.keys(scenarios[0]?.simulation || {}).map(Number).sort();
  const scoreData = years.map(year => {
    const point: any = { year };
    scenarios.forEach((s: any) => {
      const zones = Object.values(s.simulation?.[year] || {}) as any[];
      const avg = zones.length ? zones.reduce((sum, z) => sum + (z.sustainability_score || 0), 0) / zones.length : 0;
      point[s.label] = Math.round(avg * 10) / 10;
    });
    return point;
  });
  const ghgData = years.map(year => {
    const point: any = { year };
    scenarios.forEach((s: any) => {
      const zones = Object.values(s.simulation?.[year] || {}) as any[];
      const total = zones.reduce((sum, z) => sum + (z.ghg_emissions_mtco2 || 0), 0);
      point[s.label] = Math.round(total * 10) / 10;
    });
    return point;
  });
  return [
    { metric: 'Sustainability Score Progression', data: scoreData },
    { metric: 'Total GHG Emissions (MtCO₂)', data: ghgData },
  ];
}

export default function ScenariosPage() {
  const [selected, setSelected] = useState<number[]>([0, 1]);
  const [results, setResults]   = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [endYear, setEndYear]   = useState(2035);

  const run = async () => {
    setLoading(true);
    const scenarios = selected.map(i => ({
      label: PRESET_SCENARIOS[i].label,
      interventions: PRESET_SCENARIOS[i].interventions,
    }));
    try {
      const r = await fetch(`${API}/api/simulation/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios, start_year: 2025, end_year: endYear }),
      });
      if (r.ok) setResults(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const allScenarios = results?.scenarios || [];
  const timeseries   = processTimeseries(allScenarios);

  const toggleScenario = (i: number) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3 text-blue-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          📈 Simulation Sandbox
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 tracking-tight">
          Scenario Comparison
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Forecast longitudinal sustainability impacts. Compare multiple capital investment strategies side-by-side against the baseline trajectory through {endYear}.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Scenario Configurator */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-4 space-y-7 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <h2 className="text-white font-bold text-lg tracking-wide border-b border-white/10 pb-4">Strategy Parameters</h2>
          
          <div className="space-y-3">
            {PRESET_SCENARIOS.map((s, i) => {
              const checked = selected.includes(i);
              return (
                <div key={i} onClick={() => toggleScenario(i)}
                  className={`group relative p-4 rounded-2xl border cursor-pointer overflow-hidden transition-all duration-300 ${checked ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5'}`}>
                  {checked && <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-2xl rounded-full"></div>}
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${checked ? 'bg-blue-500 border-blue-400' : 'border-gray-600 group-hover:border-gray-500'}`}>
                      {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <div>
                      <p className={`text-sm font-bold tracking-wide transition-colors ${checked ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}`}>{s.label}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5 leading-snug">{s.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="group/slider mt-6">
            <div className="flex justify-between items-end mb-2">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest">Simulation End Year</label>
              <p className="text-white font-black text-xl tracking-tight">{endYear}</p>
            </div>
            <input type="range" min={2027} max={2040} step={1} value={endYear}
              onChange={e => setEndYear(+e.target.value)}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]"/>
          </div>

          <button onClick={run} disabled={loading || selected.length === 0}
            className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] disabled:opacity-50 transition-all duration-300 transform active:scale-95 bg-[length:200%_auto] hover:bg-right">
            {loading ? '⏳ Extrapolating...' : '▶ Render Simulation'}
          </button>
        </motion.div>

        {/* Charts & Graphs Area */}
        <div className="lg:col-span-8 space-y-8 flex flex-col">
          {timeseries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-transparent rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                  <span className="text-3xl opacity-50">📊</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">No Simulation Rendered</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Select at least two strategic vectors and compute the extrapolation matrix to view historical trajectories vs predictive outcomes.</p>
              </div>
            </motion.div>
          ) : (
            timeseries.map((ts, ti) => (
              <motion.div key={ti} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ti * 0.1 }}
                className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl group">
                <h3 className="text-white font-bold tracking-wide mb-6 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                  {ts.metric}
                </h3>
                
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ts.data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                      <XAxis dataKey="year" tick={{fill:'#64748b', fontSize:11, fontWeight:600}} axisLine={false} tickLine={false} dy={10}/>
                      <YAxis tick={{fill:'#64748b', fontSize:11, fontWeight:500}} axisLine={false} tickLine={false} dx={-10}/>
                      <Tooltip 
                        contentStyle={{backgroundColor:'rgba(15, 23, 42, 0.9)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff', boxShadow:'0 10px 25px -5px rgba(0, 0, 0, 0.5)'}}
                        itemStyle={{fontWeight: 700}}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle"/>
                      <ReferenceLine x={2025} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} label={{value:'Present Day',fill:'#f59e0b',fontSize:10, position: 'top'}}/>
                      
                      {allScenarios.map((s: any, i: number) => {
                        const isBase = s.label.includes('Baseline');
                        return (
                          <Line key={s.label} type="monotone" dataKey={s.label}
                            stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                            strokeWidth={isBase ? 2 : 3}
                            strokeDasharray={isBase ? '5 5' : undefined}
                            dot={{ r: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            className="transition-all duration-700"
                            style={{ filter: `drop-shadow(0 4px 6px ${SCENARIO_COLORS[i % SCENARIO_COLORS.length]}40)` }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ))
          )}

          {/* City timeseries table */}
          {results?.city_timeseries?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-x-auto">
              <h3 className="text-white font-bold tracking-wide mb-6">Simulation DataFrame Reference</h3>
              <table className="w-full text-sm text-gray-300 whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 text-left">
                    <th className="pb-3 font-bold tracking-widest uppercase text-[10px]">Active Scenario Vector</th>
                    <th className="pb-3 font-bold tracking-widest uppercase text-[10px] text-center">Temporal Index</th>
                    <th className="pb-3 font-bold tracking-widest uppercase text-[10px] text-right">Composite Score</th>
                    <th className="pb-3 font-bold tracking-widest uppercase text-[10px] text-right">GHG Footprint (MtCO₂)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.city_timeseries
                    .filter((_: any, i: number) => i % 2 === 0)
                    .slice(0, 24)
                    .map((row: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="py-2.5 font-medium text-white">{row.label}</td>
                        <td className="text-center text-gray-400 font-mono">{row.year}</td>
                        <td className="text-right text-cyan-400 font-bold">{row.avg_score}</td>
                        <td className="text-right text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]">{row.total_ghg}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
