'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  compareScenarios,
  getMlExplain,
  getDigitalTwinGraph,
  runStressTest,
  simulateDigitalTwinFailure,
  type MlExplainResponse,
  type ScenarioCompareResponse,
  type StressTestRequest,
  type StressTestResponse,
  type TwinGraphResponse,
} from '@/lib/sustainabilityApi';

const ZONES = ['North', 'South', 'East', 'West', 'Central', 'North-East', 'North-West', 'South-West', 'South-East'];

const ZONE_COLORS: Record<string, string> = {
  normal: '#10b981',
  impacted: '#f59e0b',
  failed: '#ef4444',
};

const EDGE_COLORS: Record<string, string> = {
  water_pipeline: '#06b6d4',
  energy_grid: '#f59e0b',
  waste_transport: '#8b5cf6',
};

const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  North: { x: 350, y: 120 },
  'North-West': { x: 180, y: 150 },
  'North-East': { x: 520, y: 150 },
  West: { x: 160, y: 280 },
  Central: { x: 340, y: 270 },
  East: { x: 510, y: 270 },
  'South-West': { x: 190, y: 400 },
  South: { x: 345, y: 410 },
  'South-East': { x: 510, y: 400 },
};

type PolicyInputs = {
  solar_increase: number;
  waste_improvement: number;
  green_expansion: number;
  water_conservation: number;
  ev_adoption: number;
  public_transport: number;
};

function toPolicyFractions(policy: PolicyInputs) {
  return {
    solar_increase: policy.solar_increase / 100,
    waste_improvement: policy.waste_improvement / 100,
    green_expansion: policy.green_expansion / 100,
    water_conservation: policy.water_conservation / 100,
    ev_adoption: policy.ev_adoption / 100,
    public_transport: policy.public_transport / 100,
  };
}

/** FastAPI wraps failure payload in `{ graph: { nodes, links } }`; UI expects nodes/links at top level. */
function normalizeTwinResponse(data: unknown): TwinGraphResponse {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, unknown>;
  if (d.graph && typeof d.graph === 'object' && !Array.isArray(d.graph)) {
    const g = d.graph as Record<string, unknown>;
    return {
      nodes: Array.isArray(g.nodes) ? (g.nodes as TwinGraphResponse['nodes']) : [],
      links: Array.isArray(g.links) ? (g.links as TwinGraphResponse['links']) : [],
      metrics: (g.metrics as Record<string, unknown>) || {},
      directly_impacted: d.directly_impacted as TwinGraphResponse['directly_impacted'],
      network_resilience_pct:
        typeof d.network_resilience_pct === 'number' ? d.network_resilience_pct : undefined,
    };
  }
  return data as TwinGraphResponse;
}

export default function DigitalTwinPage() {
  const [graphData, setGraphData] = useState<TwinGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedZone, setFailedZone] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tab, setTab] = useState<'graph' | 'stress'>('graph');
  const [error, setError] = useState<string | null>(null);

  const [stressData, setStressData] = useState<StressTestResponse | null>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [stressParams, setStressParams] = useState<StressTestRequest>({
    population_growth_rate: 0.025,
    temp_rise_per_year: 0.05,
    years: 15,
  });

  const [policyInputs, setPolicyInputs] = useState<PolicyInputs>({
    solar_increase: 30,
    waste_improvement: 25,
    green_expansion: 20,
    water_conservation: 25,
    ev_adoption: 20,
    public_transport: 25,
  });
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyData, setPolicyData] = useState<ScenarioCompareResponse | null>(null);
  const [explainZone, setExplainZone] = useState('Central');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainData, setExplainData] = useState<MlExplainResponse | null>(null);

  const loadGraph = useCallback(async (zone?: string) => {
    setLoading(true);
    setError(null);
    try {
      const raw = zone ? await simulateDigitalTwinFailure(zone) : await getDigitalTwinGraph();
      setGraphData(normalizeTwinResponse(raw));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load digital twin graph');
    } finally {
      setLoading(false);
    }
  }, []);

  const runStress = useCallback(async (params: StressTestRequest) => {
    setStressLoading(true);
    try {
      const data = await runStressTest(params);
      setStressData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run stress test');
    } finally {
      setStressLoading(false);
    }
  }, []);

  const runPolicyCompare = useCallback(async (inputs: PolicyInputs, zone: string) => {
    setPolicyLoading(true);
    setExplainLoading(true);
    setError(null);
    try {
      const [data, explanation] = await Promise.all([
        compareScenarios({
          scenarios: [
            {
              label: 'Live Policy',
              interventions: toPolicyFractions(inputs),
            },
          ],
          start_year: 2025,
          end_year: 2035,
        }),
        getMlExplain(zone, 2024),
      ]);
      setPolicyData(data);
      setExplainData(explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run policy simulation');
    } finally {
      setPolicyLoading(false);
      setExplainLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    if (tab !== 'stress') return;
    runStress(stressParams);
  }, [tab, runStress, stressParams]);

  const nodes = graphData?.nodes || [];
  const links = graphData?.links || [];
  const getNodeByZone = (zone: string) => nodes.find((node) => node.id === zone);

  const policyChartData = useMemo(() => {
    const rows = policyData?.city_timeseries || [];
    const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
    return years.map((year) => {
      const baseline = rows.find((r) => r.label === 'Baseline' && r.year === year);
      const live = rows.find((r) => r.label === 'Live Policy' && r.year === year);
      return {
        year,
        baseline_score: baseline?.avg_score ?? 0,
        live_score: live?.avg_score ?? 0,
        baseline_ghg: baseline?.total_ghg ?? 0,
        live_ghg: live?.total_ghg ?? 0,
      };
    });
  }, [policyData]);

  const finalPolicyPoint = policyChartData[policyChartData.length - 1];
  const scoreGain = finalPolicyPoint ? finalPolicyPoint.live_score - finalPolicyPoint.baseline_score : 0;
  const ghgDrop = finalPolicyPoint ? finalPolicyPoint.baseline_ghg - finalPolicyPoint.live_ghg : 0;
  const explainBars = (explainData?.waterfall || []).slice(0, 6);

  const handleZoneClick = (zone: string) => {
    if (failedZone === zone) {
      setFailedZone(null);
      loadGraph();
      return;
    }
    setFailedZone(zone);
    loadGraph(zone);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3 text-cyan-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          Interactive Simulation
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 tracking-tight">
          Digital Twin Network
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Visualize city infrastructure dependencies and evaluate how policy changes shift resilience, score, and emissions in real time.
        </p>
      </motion.div>

      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 mb-8 relative z-10">
        {(['graph', 'stress'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === 'stress' && tab !== 'stress') {
                runPolicyCompare(policyInputs, explainZone);
              }
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              tab === t
                ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
                : 'bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
            }`}
          >
            {t === 'graph' ? 'Network Resilience Map' : 'Policy Impact Twin'}
          </button>
        ))}
      </div>

      {tab === 'graph' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex flex-wrap items-center gap-4 mb-5 text-xs font-bold tracking-widest uppercase text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-4 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              Water Network
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              Energy Grid
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              Waste Logistics
            </span>

            {failedZone && (
              <button
                onClick={() => {
                  setFailedZone(null);
                  loadGraph();
                }}
                className="ml-auto px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/20 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                Reset Network
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl h-[550px] group">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1220]/80 backdrop-blur-sm z-20">
                  <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                  <div className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">Rendering topology...</div>
                </div>
              )}

              <svg width="100%" height="100%" viewBox="0 0 700 550" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="severe-glow">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {links.map((link, i) => {
                  const src = ZONE_POSITIONS[link.source];
                  const dst = ZONE_POSITIONS[link.target];
                  if (!src || !dst) return null;
                  const isImpactedLine = failedZone && (link.source === failedZone || link.target === failedZone);
                  return (
                    <line
                      key={`${link.source}-${link.target}-${i}`}
                      x1={src.x}
                      y1={src.y}
                      x2={dst.x}
                      y2={dst.y}
                      stroke={EDGE_COLORS[link.type] || '#64748b'}
                      strokeWidth={isImpactedLine ? 4 : 2}
                      strokeOpacity={isImpactedLine ? 1 : 0.3}
                      strokeDasharray={link.type === 'waste_transport' ? '6 4' : undefined}
                      className="transition-all duration-700 ease-in-out"
                      filter="url(#glow)"
                    />
                  );
                })}

                {ZONES.map((zone) => {
                  const pos = ZONE_POSITIONS[zone];
                  const node = getNodeByZone(zone);
                  const status = node?.status || 'normal';
                  const color = ZONE_COLORS[status] || '#10b981';
                  const score = node?.score ?? 55;
                  const isFailed = zone === failedZone;
                  const isHovered = zone === hovered;

                  return (
                    <g
                      key={zone}
                      transform={`translate(${pos.x},${pos.y})`}
                      onClick={() => handleZoneClick(zone)}
                      onMouseEnter={() => setHovered(zone)}
                      onMouseLeave={() => setHovered(null)}
                      className="cursor-pointer"
                    >
                      {isFailed && (
                        <circle r={45} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.8} filter="url(#severe-glow)">
                          <animate attributeName="r" values="35;55;35" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      <circle
                        r={isHovered || isFailed ? 34 : 30}
                        fill={`${color}20`}
                        stroke={color}
                        strokeWidth={isFailed ? 3 : 2}
                        filter={isFailed ? 'url(#severe-glow)' : 'url(#glow)'}
                        className="transition-all duration-300"
                      />

                      <circle
                        r={isHovered || isFailed ? 28 : 24}
                        fill={`${color}40`}
                        stroke="none"
                        className="transition-all duration-300"
                      />

                      <text y={-6} textAnchor="middle" fill="white" fontSize={11} fontWeight="800" className="drop-shadow-md">
                        {zone}
                      </text>
                      <text y={12} textAnchor="middle" fill="#f8fafc" fontSize={12} fontWeight="700">
                        {score}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {hovered && (() => {
                const node = getNodeByZone(hovered);
                if (!node) return null;
                const statusColor = ZONE_COLORS[node.status || 'normal'] || '#10b981';
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-6 right-6 bg-[#0B1220]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 min-w-[220px] shadow-2xl z-30 pointer-events-none"
                  >
                    <p className="font-black text-white text-lg tracking-tight mb-3 border-b border-white/10 pb-2">{hovered}</p>
                    <div className="space-y-2 text-xs font-medium uppercase tracking-widest text-gray-400">
                      <div className="flex justify-between items-center">
                        <span>Score</span>
                        <span className="text-white text-sm bg-white/10 px-2 py-0.5 rounded">{node.score ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Population</span>
                        <span className="text-gray-300">{((node.population ?? 0) / 1e6).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Water Gap</span>
                        <span className={(node.water_stress ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {node.water_stress ?? 0} MGD
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Status</span>
                        <span style={{ color: statusColor }} className="font-bold">
                          {node.status || 'normal'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              {failedZone && graphData?.directly_impacted ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-3xl rounded-full" />
                  <h3 className="text-red-400 font-bold mb-1 tracking-wide">Cascading failure</h3>
                  <p className="text-white text-2xl font-black tracking-tight mb-4">{failedZone} offline</p>

                  <div className="bg-black/20 rounded-xl p-4 mb-5 border border-red-500/10">
                    <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">System resilience</p>
                    <p className="text-amber-400 font-extrabold text-3xl">{graphData.network_resilience_pct ?? 0}%</p>
                  </div>

                  <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 border-b border-red-500/20 pb-2">Impacted zones</p>
                  <div className="space-y-3">
                    {Object.entries(graphData.directly_impacted).map(([zone, data]) => (
                      <div key={zone} className="flex items-center justify-between border-l-2 border-amber-500 pl-3">
                        <div>
                          <p className="text-white font-bold text-sm tracking-wide">{zone}</p>
                          <p className="text-amber-500/70 text-[10px] uppercase font-bold tracking-wider">
                            {(data.impact_type || 'impact').replace('_', ' ')}
                          </p>
                        </div>
                        <span className="text-red-400 font-mono font-bold text-sm">-{data.reduction_percent ?? 0}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] mx-auto">
                    <div className="w-8 h-8 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h3 className="text-center text-white font-bold text-xl tracking-wide mb-1">Grid stable</h3>
                  <p className="text-center text-gray-500 text-sm mb-8">All critical city infrastructure is running in nominal range.</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'stress' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-white font-bold mb-5">Urban stress parameters</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Population growth</span>
                    <span>{(stressParams.population_growth_rate * 100).toFixed(2)}% / year</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={6}
                    step={0.1}
                    value={stressParams.population_growth_rate * 100}
                    onChange={(e) =>
                      setStressParams((prev) => ({
                        ...prev,
                        population_growth_rate: Number(e.target.value) / 100,
                      }))
                    }
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Temperature rise</span>
                    <span>{stressParams.temp_rise_per_year.toFixed(3)}C / year</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    value={stressParams.temp_rise_per_year}
                    onChange={(e) =>
                      setStressParams((prev) => ({
                        ...prev,
                        temp_rise_per_year: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Simulation horizon</span>
                    <span>{stressParams.years} years</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    step={1}
                    value={stressParams.years}
                    onChange={(e) =>
                      setStressParams((prev) => ({
                        ...prev,
                        years: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-white font-bold mb-5">Live policy levers</h3>
              <div className="grid grid-cols-1 gap-4">
                {(
                  [
                    ['solar_increase', 'Solar expansion'],
                    ['waste_improvement', 'Waste improvement'],
                    ['water_conservation', 'Water conservation'],
                    ['green_expansion', 'Green expansion'],
                    ['ev_adoption', 'EV adoption'],
                    ['public_transport', 'Public transport'],
                  ] as Array<[keyof PolicyInputs, string]>
                ).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{label}</span>
                      <span>{policyInputs[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={policyInputs[key]}
                      onChange={(e) =>
                        setPolicyInputs((prev) => ({
                          ...prev,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <select
                  value={explainZone}
                  onChange={(e) => setExplainZone(e.target.value)}
                  className="flex-1 rounded-xl bg-black/30 border border-white/15 text-gray-200 text-sm px-3 py-2"
                >
                  {ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => runPolicyCompare(policyInputs, explainZone)}
                  disabled={policyLoading || explainLoading}
                  className="px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-400/40 text-violet-200 text-xs font-bold tracking-widest uppercase disabled:opacity-50"
                >
                  {policyLoading || explainLoading ? 'Running...' : 'Run Simulation'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Policy twin indicators</h3>
                {policyLoading && <span className="text-xs text-violet-300">Updating...</span>}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs text-emerald-300 uppercase tracking-widest">Score gain (2035)</p>
                  <p className="text-2xl font-black text-emerald-300">{scoreGain.toFixed(2)}</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                  <p className="text-xs text-cyan-300 uppercase tracking-widest">GHG reduction (2035)</p>
                  <p className="text-2xl font-black text-cyan-300">{ghgDrop.toFixed(2)}</p>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={policyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="baseline_score" stroke="#94a3b8" name="Baseline score" dot={false} />
                    <Line type="monotone" dataKey="live_score" stroke="#10b981" name="Live policy score" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold text-sm">SHAP explainability ({explainZone})</h4>
                  {explainLoading && <span className="text-xs text-violet-300">Refreshing...</span>}
                </div>
                {explainBars.length > 0 ? (
                  <div className="space-y-2">
                    {explainBars.map((item) => (
                      <div key={item.feature} className="grid grid-cols-[1fr_auto] gap-3 items-center">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-300 truncate">{item.feature}</p>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                            <div
                              className={`h-full ${item.shap_value >= 0 ? 'bg-emerald-400/80' : 'bg-rose-400/80'}`}
                              style={{ width: `${Math.min(100, Math.max(6, item.abs_value * 8))}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-xs font-mono ${item.shap_value >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {item.shap_value >= 0 ? '+' : ''}
                          {item.shap_value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Run simulation to populate model impact drivers.</p>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Stress outcomes</h3>
                {stressLoading && <span className="text-xs text-cyan-300">Running...</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1">
                {(stressData?.zones || []).map((zone) => (
                  <div
                    key={zone.zone}
                    className={`rounded-2xl border p-4 bg-black/30 ${
                      zone.overall_risk === 'Critical'
                        ? 'border-red-500/30'
                        : zone.overall_risk === 'High'
                        ? 'border-amber-500/30'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold">{zone.zone}</p>
                      <span className="text-[10px] uppercase tracking-widest text-gray-300">{zone.overall_risk}</span>
                    </div>
                    <p className="text-xs text-gray-400">Water crisis year: {zone.water_crisis_year ?? 'Stable'}</p>
                    <p className="text-xs text-gray-400 mt-1">Waste crisis year: {zone.waste_crisis_year ?? 'Stable'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
