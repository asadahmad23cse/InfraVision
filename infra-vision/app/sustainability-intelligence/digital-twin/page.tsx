'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

const ZONES = ["North","South","East","West","Central","North-East","North-West","South-West","South-East"];
const API = process.env.NEXT_PUBLIC_SUSTAINABILITY_API || '';

const ZONE_COLORS: Record<string, string> = {
  normal:   '#22c55e',
  impacted: '#f59e0b',
  failed:   '#ef4444',
};

const EDGE_COLORS: Record<string, string> = {
  water_pipeline:  '#06b6d4',
  energy_grid:     '#f59e0b',
  waste_transport: '#8b5cf6',
};

// Simple zone position layout (approximate Delhi map positions)
const ZONE_POSITIONS: Record<string, {x: number; y: number}> = {
  "North":      {x: 350, y: 120},
  "North-West": {x: 180, y: 150},
  "North-East": {x: 520, y: 150},
  "West":       {x: 160, y: 280},
  "Central":    {x: 340, y: 270},
  "East":       {x: 510, y: 270},
  "South-West": {x: 190, y: 400},
  "South":      {x: 345, y: 410},
  "South-East": {x: 510, y: 400},
};

export default function DigitalTwinPage() {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [failedZone, setFailedZone] = useState<string | null>(null);
  const [hovered, setHovered]     = useState<string | null>(null);
  const [stressData, setStressData] = useState<any>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [tab, setTab] = useState<'graph'|'stress'>('graph');

  const loadGraph = useCallback(async (zone?: string) => {
    setLoading(true);
    try {
      const url = zone
        ? `${API}/api/simulation/failure/${encodeURIComponent(zone)}`
        : `${API}/api/simulation/graph`;
      const r = await fetch(url);
      if (r.ok) setGraphData(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [API]);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  const handleZoneClick = (zone: string) => {
    if (failedZone === zone) {
      setFailedZone(null);
      loadGraph();
    } else {
      setFailedZone(zone);
      loadGraph(zone);
    }
  };

  const runStressTest = async () => {
    setStressLoading(true);
    try {
      const r = await fetch(`${API}/api/simulation/stress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ population_growth_rate: 0.025, temp_rise_per_year: 0.05, years: 15 }),
      });
      if (r.ok) setStressData(await r.json());
    } catch (e) { console.error(e); }
    finally { setStressLoading(false); }
  };

  const nodes = graphData?.nodes || [];
  const links = graphData?.links || [];

  const getNodeByZone = (z: string) => nodes.find((n: any) => n.id === z);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🏙️ Digital Twin — Delhi City Model</h1>
        <p className="text-gray-400 text-sm mt-1">Click any zone to simulate infrastructure failure and see cascade impact</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['graph','stress'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==='stress' && !stressData) runStressTest(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t ?'bg-emerald-600 text-white':'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>
            {t === 'graph' ? '🌐 City Graph' : '📊 Stress Test'}
          </button>
        ))}
      </div>

      {tab === 'graph' && (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-400">
            <span>Click zone node to simulate failure</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-cyan-400 inline-block"/>Water Pipeline</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-amber-400 inline-block"/>Energy Grid</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-purple-400 inline-block"/>Waste Transport</span>
            {failedZone && (
              <button onClick={() => { setFailedZone(null); loadGraph(); }}
                className="ml-auto px-3 py-1 bg-slate-600 rounded text-white hover:bg-slate-500">
                ✕ Clear Failure
              </button>
            )}
          </div>

          {/* SVG City Graph */}
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                <div className="text-gray-400">Rendering city model…</div>
              </div>
            )}
            <svg width="100%" viewBox="0 0 700 550" className="w-full">
              {/* Draw edges */}
              {links.map((link: any, i: number) => {
                const src = ZONE_POSITIONS[link.source];
                const dst = ZONE_POSITIONS[link.target];
                if (!src || !dst) return null;
                return (
                  <line key={i}
                    x1={src.x} y1={src.y} x2={dst.x} y2={dst.y}
                    stroke={EDGE_COLORS[link.type] || '#64748b'}
                    strokeWidth={2} strokeOpacity={0.6} strokeDasharray={link.type === 'waste_transport' ? '6 3' : undefined}
                  />
                );
              })}

              {/* Draw nodes */}
              {ZONES.map(zone => {
                const pos = ZONE_POSITIONS[zone];
                const node = getNodeByZone(zone);
                const status = node?.status || 'normal';
                const color = ZONE_COLORS[status] || '#22c55e';
                const score = node?.score || 55;
                const isFailed = zone === failedZone;
                const isHovered = zone === hovered;

                return (
                  <g key={zone} transform={`translate(${pos.x},${pos.y})`}
                    onClick={() => handleZoneClick(zone)}
                    onMouseEnter={() => setHovered(zone)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer">
                    {/* Pulse ring for failed zone */}
                    {isFailed && (
                      <circle r={36} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.5}>
                        <animate attributeName="r" values="32;44;32" dur="1.5s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
                      </circle>
                    )}
                    <circle r={isHovered || isFailed ? 32 : 28}
                      fill={color + '22'} stroke={color}
                      strokeWidth={isFailed ? 3 : 2}
                      style={{transition: 'all 0.3s'}}/>
                    <text y={-5} textAnchor="middle" fill="white" fontSize={11} fontWeight="600">{zone}</text>
                    <text y={10} textAnchor="middle" fill={color} fontSize={10}>{score}</text>
                    {status !== 'normal' && (
                      <text y={24} textAnchor="middle" fill={color} fontSize={8}>
                        {status === 'failed' ? '⚠ FAILED' : '↘ IMPACTED'}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Tooltip */}
            {hovered && (() => {
              const node = getNodeByZone(hovered);
              if (!node) return null;
              return (
                <div className="absolute top-4 right-4 bg-slate-800 border border-slate-600 rounded-xl p-4 min-w-48 z-20 text-sm">
                  <p className="font-bold text-white mb-2">{hovered}</p>
                  <div className="space-y-1 text-gray-300">
                    <div className="flex justify-between"><span>Score</span><span className="text-emerald-400 font-bold">{node.score}</span></div>
                    <div className="flex justify-between"><span>Pop</span><span>{(node.population/1e6).toFixed(1)}M</span></div>
                    <div className="flex justify-between"><span>Water Gap</span><span className={node.water_stress > 0 ? 'text-red-400':'text-green-400'}>{node.water_stress} MGD</span></div>
                    <div className="flex justify-between"><span>GHG</span><span>{node.ghg} MtCO₂</span></div>
                    <div className="flex justify-between"><span>Status</span><span style={{color: ZONE_COLORS[node.status]}}>{node.status.toUpperCase()}</span></div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Failure summary */}
          {failedZone && graphData?.directly_impacted && (
            <div className="mt-4 bg-red-500/10 border border-red-500/40 rounded-xl p-4">
              <h3 className="text-red-400 font-bold mb-2">⚠ Cascade Impact — {failedZone} FAILED</h3>
              <p className="text-gray-300 text-sm mb-3">
                Network resilience: <span className="text-amber-400 font-bold">{graphData.network_resilience_pct}%</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(graphData.directly_impacted).map(([zone, data]: any) => (
                  <div key={zone} className="bg-slate-800 rounded-lg p-3">
                    <p className="text-amber-400 font-medium text-sm">{zone}</p>
                    <p className="text-gray-400 text-xs">{data.impact_type?.replace('_',' ')}</p>
                    <p className="text-red-400 text-xs">-{data.reduction_percent}% capacity</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Network metrics */}
          {graphData?.metrics && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {Object.entries(graphData.metrics).map(([k, v]: any) => (
                <div key={k} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">{k.replace(/_/g,' ')}</p>
                  <p className="text-white font-bold">{String(v)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'stress' && (
        <div>
          {stressLoading && <div className="text-gray-400 py-8 text-center">Running stress simulation…</div>}
          {stressData && (
            <>
              <div className="mb-4 text-sm text-gray-400">
                Population growth: <span className="text-white">{(stressData.growth_rate*100).toFixed(1)}%/yr</span> ·
                Temp rise: <span className="text-white">{stressData.temp_rise_per_year}°C/yr</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stressData.zones?.map((z: any) => (
                  <div key={z.zone} className={`rounded-xl border p-4 ${z.overall_risk==='Critical'?'bg-red-500/10 border-red-500/40': z.overall_risk==='High'?'bg-amber-500/10 border-amber-500/40':'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold">{z.zone}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${z.overall_risk==='Critical'?'bg-red-500/30 text-red-400':z.overall_risk==='High'?'bg-amber-500/30 text-amber-400':'bg-slate-600 text-gray-300'}`}>
                        {z.overall_risk}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Water crisis year</span>
                        <span className={z.water_crisis_year ? 'text-red-400' : 'text-green-400'}>
                          {z.water_crisis_year || 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Waste crisis year</span>
                        <span className={z.waste_crisis_year ? 'text-amber-400' : 'text-green-400'}>
                          {z.waste_crisis_year || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
