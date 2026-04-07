'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { compareScenarios } from '@/lib/sustainabilityApi';

// ── Scenario config ───────────────────────────────────────────────────────────
const SCENARIO_COLORS = ['#94a3b8', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];
const SCENARIO_GLOWS  = ['rgba(148,163,184,0.3)', 'rgba(16,185,129,0.4)', 'rgba(6,182,212,0.4)', 'rgba(245,158,11,0.4)', 'rgba(139,92,246,0.4)', 'rgba(236,72,153,0.4)'];

const PRESET_SCENARIOS = [
  {
    label: 'Baseline (Do Nothing)',
    icon: '📉', badge: 'Reference',
    badgeCls: 'bg-gray-700 text-gray-300',
    description: 'Current trajectory — no additional policy intervention',
    interventions: { solar_increase: 0.05, ev_adoption: 0.05, public_transport: 0.05, waste_improvement: 0.05, green_expansion: 0.05, water_conservation: 0.05 },
  },
  {
    label: 'Solar Push',
    icon: '☀️', badge: 'Energy',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    description: 'Heavy rooftop solar & renewable grid investment',
    interventions: { solar_increase: 0.9, ev_adoption: 0.5, public_transport: 0.3, waste_improvement: 0.1, green_expansion: 0.1, water_conservation: 0.1 },
  },
  {
    label: 'Green City',
    icon: '🌳', badge: 'Environment',
    badgeCls: 'bg-emerald-500/20 text-emerald-400',
    description: 'Green space, water conservation & circular waste',
    interventions: { green_expansion: 0.9, water_conservation: 0.8, waste_improvement: 0.7, solar_increase: 0.2, ev_adoption: 0.2, public_transport: 0.2 },
  },
  {
    label: 'Mobility Revolution',
    icon: '⚡', badge: 'Transport',
    badgeCls: 'bg-sky-500/20 text-sky-400',
    description: 'Aggressive EV adoption and public transit network',
    interventions: { ev_adoption: 0.9, public_transport: 0.8, solar_increase: 0.5, waste_improvement: 0.2, green_expansion: 0.1, water_conservation: 0.1 },
  },
  {
    label: 'Balanced Growth',
    icon: '⚖️', badge: 'Integrated',
    badgeCls: 'bg-violet-500/20 text-violet-400',
    description: 'Moderate balanced investment across all dimensions',
    interventions: { solar_increase: 0.5, waste_improvement: 0.5, green_expansion: 0.5, water_conservation: 0.5, ev_adoption: 0.4, public_transport: 0.4 },
  },
];

// ── Chart configs ─────────────────────────────────────────────────────────────
const CHART_CONFIGS = [
  { key: 'avg_score',   label: 'Sustainability Score Progression', unit: 'pts',  color: 'from-cyan-400 to-blue-500',    icon: '📊', domain: [40, 95]   as [number, number], description: 'City-wide composite sustainability index (0–100)' },
  { key: 'total_ghg',  label: 'Total GHG Emissions',              unit: 'MtCO₂',color: 'from-emerald-400 to-teal-500', icon: '🌡️', domain: [0, 80]    as [number, number], description: 'Aggregate greenhouse gas emissions across all zones' },
  { key: 'renewable_pct', label: 'Renewable Energy Share',        unit: '%',     color: 'from-amber-400 to-orange-500', icon: '☀️', domain: [0, 65]    as [number, number], description: 'Percentage of energy from renewable sources' },
  { key: 'waste_pct',  label: 'Waste Processing Rate',            unit: '%',     color: 'from-violet-400 to-purple-500',icon: '♻️', domain: [60, 100]  as [number, number], description: 'Percentage of municipal waste processed / diverted' },
];

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ScenarioTooltip({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[200px]">
      <p className="text-gray-400 text-xs font-bold mb-3 tracking-widest uppercase">Year {label}</p>
      <div className="space-y-2">
        {payload.map((p, i) => (
          <div key={i} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-gray-300 text-xs truncate max-w-[120px]">{p.name}</span>
            </div>
            <span className="text-white font-bold text-xs">{p.value} <span className="text-gray-500">{unit}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  const [selected, setSelected] = useState<number[]>([0, 1]);
  const [results, setResults]   = useState<{ city_timeseries?: Array<{ label: string; year: number; avg_score: number; total_ghg: number; renewable_pct?: number; waste_pct?: number }> } | null>(null);
  const [loading, setLoading]   = useState(false);
  const [endYear, setEndYear]   = useState(2035);
  const [error, setError]       = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<string>('avg_score');

  const run = async () => {
    setLoading(true); setError(null);
    const scenarios = selected.map(i => ({
      label: PRESET_SCENARIOS[i].label,
      interventions: PRESET_SCENARIOS[i].interventions,
    }));
    try {
      const res = await compareScenarios({ scenarios, start_year: 2025, end_year: endYear });
      setResults(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to compare scenarios');
    } finally { setLoading(false); }
  };

  const toggleScenario = (i: number) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  // Build wide-format chart data from city_timeseries (one row per year, one col per scenario)
  const chartData = useMemo(() => {
    const ts = results?.city_timeseries;
    if (!ts?.length) return {};
    const byYear: Record<number, Record<string, number>> = {};
    for (const row of ts) {
      if (!byYear[row.year]) byYear[row.year] = { year: row.year };
      byYear[row.year][row.label] = row.avg_score;
      byYear[row.year][`${row.label}__total_ghg`] = row.total_ghg;
      byYear[row.year][`${row.label}__renewable_pct`] = row.renewable_pct ?? 0;
      byYear[row.year][`${row.label}__waste_pct`] = row.waste_pct ?? 0;
    }
    const years = Object.keys(byYear).map(Number).sort();
    const base = years.map(y => byYear[y]);

    const metricData: Record<string, typeof base> = {
      avg_score:    base,
      total_ghg:    base.map(r => {
        const out: Record<string, number> = { year: r.year };
        for (const k of Object.keys(r)) {
          if (k !== 'year') {
            if (k.endsWith('__total_ghg')) out[k.replace('__total_ghg', '')] = r[k];
            else if (!k.includes('__')) { /* skip */ }
          }
        }
        return out;
      }),
      renewable_pct: base.map(r => {
        const out: Record<string, number> = { year: r.year };
        for (const k of Object.keys(r)) {
          if (k.endsWith('__renewable_pct')) out[k.replace('__renewable_pct', '')] = r[k];
        }
        return out;
      }),
      waste_pct: base.map(r => {
        const out: Record<string, number> = { year: r.year };
        for (const k of Object.keys(r)) {
          if (k.endsWith('__waste_pct')) out[k.replace('__waste_pct', '')] = r[k];
        }
        return out;
      }),
    };
    return metricData;
  }, [results]);

  // Unique scenario labels in results
  const scenarioLabels = useMemo(() => {
    if (!results?.city_timeseries?.length) return [];
    return [...new Set(results.city_timeseries.map(r => r.label))];
  }, [results]);

  const hasData = scenarioLabels.length > 0;
  const currentChart = CHART_CONFIGS.find(c => c.key === activeChart) ?? CHART_CONFIGS[0];
  const currentChartData = chartData[activeChart] ?? [];

  // Summary delta cards (last year vs first year for non-baseline)
  const summaryCards = useMemo(() => {
    if (!results?.city_timeseries?.length) return [];
    const ts = results.city_timeseries;
    const firstYear = Math.min(...ts.map(r => r.year));
    const lastYear  = Math.max(...ts.map(r => r.year));
    return scenarioLabels.filter(l => l !== 'Baseline').map(label => {
      const first = ts.find(r => r.label === label && r.year === firstYear);
      const last  = ts.find(r => r.label === label && r.year === lastYear);
      const base1 = ts.find(r => r.label === 'Baseline' && r.year === firstYear);
      const baseN = ts.find(r => r.label === 'Baseline' && r.year === lastYear);
      const scoreDelta = ((last?.avg_score ?? 0) - (base1?.avg_score ?? 0)).toFixed(1);
      const ghgDelta   = ((baseN?.total_ghg ?? 0) - (last?.total_ghg ?? 0)).toFixed(1);
      const preset = PRESET_SCENARIOS.find(s => s.label === label);
      return { label, icon: preset?.icon ?? '📊', badge: preset?.badge ?? '', badgeCls: preset?.badgeCls ?? '', scoreDelta, ghgDelta };
    });
  }, [results, scenarioLabels]);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3 text-blue-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          📈 Simulation Sandbox
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 tracking-tight">
          Scenario Comparison
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Forecast longitudinal sustainability impacts. Compare up to 5 capital investment strategies side-by-side across 4 key metrics through {endYear}.
        </p>
      </motion.div>

      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Panel ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-4 self-start space-y-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <h2 className="text-white font-bold text-lg tracking-wide border-b border-white/10 pb-4">Strategy Parameters</h2>

          {/* Scenario selector */}
          <div className="space-y-2.5">
            {PRESET_SCENARIOS.map((s, i) => {
              const checked = selected.includes(i);
              const color = SCENARIO_COLORS[i];
              return (
                <div key={i} onClick={() => toggleScenario(i)}
                  className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden ${checked ? 'border-opacity-60 shadow-lg' : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                  style={{ backgroundColor: checked ? `${color}12` : undefined, borderColor: checked ? `${color}50` : undefined }}>
                  {checked && <div className="absolute top-0 right-0 w-16 h-16 blur-2xl rounded-full" style={{ backgroundColor: color, opacity: 0.15 }} />}
                  <div className="flex items-center gap-3">
                    {/* Color-coded checkbox */}
                    <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all`}
                      style={{ backgroundColor: checked ? color : 'transparent', borderColor: checked ? color : '#4b5563' }}>
                      {checked && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <span className="text-lg">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-bold tracking-wide ${checked ? 'text-white' : 'text-gray-300'}`}>{s.label}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${s.badgeCls}`}>{s.badge}</span>
                      </div>
                      <p className="text-gray-500 text-[11px] leading-snug">{s.description}</p>
                    </div>
                  </div>
                  {/* Intervention mini-bars */}
                  {checked && (
                    <div className="mt-3 grid grid-cols-6 gap-1">
                      {Object.entries(s.interventions).map(([k, v]) => (
                        <div key={k} className="flex flex-col items-center gap-1">
                          <div className="w-full h-8 bg-gray-800 rounded-sm overflow-hidden flex flex-col-reverse">
                            <div className="w-full rounded-sm" style={{ height: `${v * 100}%`, backgroundColor: color, opacity: 0.8 }} />
                          </div>
                          <span className="text-[8px] text-gray-600 text-center leading-none">{k.split('_')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* End year slider */}
          <div className="pt-2">
            <div className="flex justify-between items-end mb-2">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest">Simulation End Year</label>
              <p className="text-white font-black text-xl tracking-tight">{endYear}</p>
            </div>
            <input type="range" min={2027} max={2040} step={1} value={endYear}
              onChange={e => setEndYear(+e.target.value)}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>2027</span><span>2040</span></div>
          </div>

          <button onClick={run} disabled={loading || selected.length === 0}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] disabled:opacity-50 transition-all duration-300 active:scale-95">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Extrapolating...
              </span>
            ) : `▶ Run ${selected.length} Scenario${selected.length !== 1 ? 's' : ''}`}
          </button>
        </motion.div>

        {/* ── Right Panel ── */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Empty state */}
          {!hasData && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-16 shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-transparent rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                  <span className="text-3xl opacity-50">📊</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Simulation Rendered</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Select at least one strategy vector and click Run Scenarios to visualize longitudinal impact trajectories through {endYear}.</p>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-24">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full border-t-2 border-r-2 border-blue-500 animate-spin" />
                <p className="text-blue-400 text-sm font-bold tracking-widest uppercase animate-pulse">Simulating {selected.length} Scenarios...</p>
                <p className="text-gray-600 text-xs">Running year-by-year zone evolution models</p>
              </div>
            </div>
          )}

          {hasData && !loading && (
            <>
              {/* ── Impact Summary Cards ── */}
              {summaryCards.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {summaryCards.slice(0, 4).map((card, i) => (
                    <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden hover:scale-[1.02] transition-transform">
                      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl opacity-20" style={{ backgroundColor: SCENARIO_COLORS[selected.find(s => PRESET_SCENARIOS[s].label === card.label) ?? i + 1] }} />
                      <div className="flex items-center gap-1.5 mb-3">
                        <span>{card.icon}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${card.badgeCls}`}>{card.badge}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-tight mb-2 font-medium truncate">{card.label}</p>
                      <div className="space-y-1">
                        <p className="text-emerald-400 font-black text-base">+{card.scoreDelta} <span className="text-gray-600 font-normal text-xs">pts vs baseline</span></p>
                        <p className="text-rose-400 font-bold text-sm">-{card.ghgDelta} <span className="text-gray-600 font-normal text-xs">MtCO₂</span></p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── Metric Selector Tabs ── */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
                {/* Tab pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {CHART_CONFIGS.map(c => (
                    <button key={c.key} onClick={() => setActiveChart(c.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeChart === c.key ? 'bg-white/10 text-white ring-1 ring-white/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                      <span>{c.icon}</span>{c.label}
                    </button>
                  ))}
                </div>

                {/* Chart header */}
                <div className="flex justify-between items-start mb-5 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-white font-bold text-base">{currentChart.label}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{currentChart.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {scenarioLabels.map((label, i) => (
                      <div key={label} className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: SCENARIO_COLORS[i], boxShadow: `0 0 4px ${SCENARIO_GLOWS[i]}` }} />
                        <span className={label === 'Baseline' ? 'opacity-60' : ''}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Chart */}
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <defs>
                        {scenarioLabels.map((label, i) => (
                          <linearGradient key={label} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SCENARIO_COLORS[i]} stopOpacity={label === 'Baseline' ? 0.05 : 0.15} />
                            <stop offset="95%" stopColor={SCENARIO_COLORS[i]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                      <YAxis domain={currentChart.domain} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dx={-8} />
                      <Tooltip content={<ScenarioTooltip unit={currentChart.unit} />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2 }} />
                      <ReferenceLine x={2025} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4}
                        label={{ value: 'Present', fill: '#f59e0b', fontSize: 9, position: 'top' }} />
                      {scenarioLabels.map((label, i) => (
                        <Area key={label} type="monotone" dataKey={label}
                          stroke={SCENARIO_COLORS[i]}
                          strokeWidth={label === 'Baseline' ? 2 : 2.5}
                          strokeDasharray={label === 'Baseline' ? '6 4' : undefined}
                          fill={`url(#grad-${i})`}
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 0, fill: SCENARIO_COLORS[i] }}
                          style={{ filter: `drop-shadow(0 0 6px ${SCENARIO_GLOWS[i]})` }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* ── Data Table ── */}
              {results?.city_timeseries && results.city_timeseries.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl overflow-x-auto">
                  <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-white font-bold tracking-wide">Simulation Data Reference</h3>
                      <p className="text-gray-500 text-xs mt-1">Year-by-year output across all selected scenarios</p>
                    </div>
                    <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono">
                      {scenarioLabels.length} scenarios · {endYear - 2025 + 1} years
                    </span>
                  </div>

                  <table className="w-full text-sm text-gray-300 whitespace-nowrap">
                    <thead>
                      <tr className="text-gray-500 text-left text-[10px] border-b border-white/10">
                        <th className="pb-3 font-bold tracking-widest uppercase">Scenario</th>
                        <th className="pb-3 font-bold tracking-widest uppercase text-center">Year</th>
                        <th className="pb-3 font-bold tracking-widest uppercase text-right">Score</th>
                        <th className="pb-3 font-bold tracking-widest uppercase text-right">GHG (MtCO₂)</th>
                        <th className="pb-3 font-bold tracking-widest uppercase text-right">Renewable %</th>
                        <th className="pb-3 font-bold tracking-widest uppercase text-right">Waste %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.city_timeseries
                        .filter((_, i) => i % 2 === 0)
                        .slice(0, 30)
                        .map((row, i) => {
                          const sIdx = scenarioLabels.indexOf(row.label);
                          const color = SCENARIO_COLORS[sIdx] ?? '#64748b';
                          return (
                            <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
                                  <span className="font-medium" style={{ color: row.label === 'Baseline' ? '#64748b' : 'white' }}>{row.label}</span>
                                </div>
                              </td>
                              <td className="text-center text-gray-400 font-mono">{row.year}</td>
                              <td className="text-right text-cyan-400 font-bold">{row.avg_score}</td>
                              <td className="text-right text-emerald-400 font-bold">{row.total_ghg}</td>
                              <td className="text-right text-amber-400 font-bold">{row.renewable_pct ?? '—'}</td>
                              <td className="text-right text-violet-400 font-bold">{row.waste_pct ?? '—'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
