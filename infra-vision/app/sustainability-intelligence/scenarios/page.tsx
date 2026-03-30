'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_SUSTAINABILITY_API || '';

const SCENARIO_COLORS = ['#64748b', '#22c55e', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];

const PRESET_SCENARIOS = [
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
    { metric: 'Average Sustainability Score', data: scoreData },
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📊 Scenario Comparison</h1>
        <p className="text-gray-400 text-sm mt-1">Compare multiple investment strategies against baseline (2025–2040)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Scenario selector */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Select Scenarios</h2>
          <div className="space-y-3">
            {PRESET_SCENARIOS.map((s, i) => (
              <label key={i} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected.includes(i)?'bg-blue-500/10 border-blue-500/50':'bg-slate-700/50 border-slate-600 hover:border-slate-500'}`}>
                <input type="checkbox" checked={selected.includes(i)} onChange={() => toggleScenario(i)}
                  className="mt-1 accent-blue-500"/>
                <div>
                  <p className="text-white text-sm font-medium">{s.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-gray-400 text-sm">Simulation End Year</label>
            <input type="range" min={2027} max={2040} step={1} value={endYear}
              onChange={e => setEndYear(+e.target.value)}
              className="w-full accent-blue-500 mt-2"/>
            <p className="text-blue-400 font-bold">{endYear}</p>
          </div>

          <button onClick={run} disabled={loading || !selected.length}
            className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all">
            {loading ? '⏳ Simulating…' : '▶ Run Comparison'}
          </button>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-5">
          {timeseries.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-slate-800 border border-slate-700 rounded-2xl">
              <div className="text-center text-gray-500">
                <p className="text-4xl mb-3">📊</p>
                <p>Select scenarios and run comparison</p>
              </div>
            </div>
          ) : (
            timeseries.map((ts, ti) => (
              <div key={ti} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4">{ts.metric}</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={ts.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <XAxis dataKey="year" tick={{fill:'#94a3b8', fontSize:11}}/>
                    <YAxis tick={{fill:'#94a3b8', fontSize:11}}/>
                    <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155',borderRadius:'8px'}}/>
                    <Legend/>
                    <ReferenceLine x={2025} stroke="#f59e0b" strokeDasharray="3 3" label={{value:'Now',fill:'#f59e0b',fontSize:10}}/>
                    {allScenarios.map((s: any, i: number) => (
                      <Line key={s.label} type="monotone" dataKey={s.label}
                        stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                        strokeWidth={s.label === 'Baseline' ? 1 : 2}
                        strokeDasharray={s.label === 'Baseline' ? '4 4' : undefined}
                        dot={false}/>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))
          )}

          {/* City timeseries table */}
          {results?.city_timeseries?.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 overflow-x-auto">
              <h3 className="text-white font-semibold mb-4">City-wide Summary by Year</h3>
              <table className="w-full text-sm text-gray-300 min-w-lg">
                <thead>
                  <tr className="border-b border-slate-700 text-gray-500 text-left">
                    <th className="pb-2">Scenario</th><th>Year</th><th>Avg Score</th><th>Total GHG (MtCO₂)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.city_timeseries
                    .filter((_: any, i: number) => i % 2 === 0)
                    .slice(0, 24)
                    .map((row: any, i: number) => (
                      <tr key={i} className="border-b border-slate-800">
                        <td className="py-1.5">{row.label}</td>
                        <td>{row.year}</td>
                        <td className="text-cyan-400">{row.avg_score}</td>
                        <td className="text-emerald-400">{row.total_ghg}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
