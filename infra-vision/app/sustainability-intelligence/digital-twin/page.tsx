'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

const ZONES = ["North","South","East","West","Central","North-East","North-West","South-West","South-East"];
const API = process.env.NEXT_PUBLIC_SUSTAINABILITY_API || '';

const ZONE_COLORS: Record<string, string> = {
  normal:   '#10b981', // emerald
  impacted: '#f59e0b', // amber
  failed:   '#ef4444', // red
};

const EDGE_COLORS: Record<string, string> = {
  water_pipeline:  '#06b6d4', // cyan
  energy_grid:     '#f59e0b', // amber
  waste_transport: '#8b5cf6', // violet
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
  }, []);

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
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3 text-cyan-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          🌐 Interactive Simulation
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 tracking-tight">
          Digital Twin Network
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Monitor the city's critical infrastructure. Click any geographic zone to simulate a catastrophic failure and trace the cascading impact across the water, energy, and waste grids.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 relative z-10">
        {(['graph','stress'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==='stress' && !stressData) runStressTest(); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${tab===t?'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20':'bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
            {t === 'graph' ? '🌐 Network Resilience Map' : '📊 Projected Stress Test'}
          </button>
        ))}
      </div>

      {tab === 'graph' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          
          <div className="flex flex-wrap items-center gap-4 mb-5 text-xs font-bold tracking-widest uppercase text-gray-500">
            <span className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"/>Water Network</span>
            <span className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"/>Energy Grid</span>
            <span className="flex items-center gap-2"><span className="w-4 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]"/>Waste Logistics</span>
            
            {failedZone && (
              <button onClick={() => { setFailedZone(null); loadGraph(); }}
                className="ml-auto px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/20 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                ✕ Reboot Network
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl h-[550px] group">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1220]/80 backdrop-blur-sm z-20">
                  <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                  <div className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">Rendering Topology...</div>
                </div>
              )}
              
              <svg width="100%" height="100%" viewBox="0 0 700 550" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="severe-glow">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Draw edges */}
                {links.map((link: any, i: number) => {
                  const src = ZONE_POSITIONS[link.source];
                  const dst = ZONE_POSITIONS[link.target];
                  if (!src || !dst) return null;
                  const isImpactedLine = failedZone && (link.source === failedZone || link.target === failedZone);
                  return (
                    <line key={i}
                      x1={src.x} y1={src.y} x2={dst.x} y2={dst.y}
                      stroke={EDGE_COLORS[link.type] || '#64748b'}
                      strokeWidth={isImpactedLine ? 4 : 2} 
                      strokeOpacity={isImpactedLine ? 1 : 0.3} 
                      strokeDasharray={link.type === 'waste_transport' ? '6 4' : undefined}
                      className="transition-all duration-700 ease-in-out"
                      filter="url(#glow)"
                    />
                  );
                })}

                {/* Draw nodes */}
                {ZONES.map(zone => {
                  const pos = ZONE_POSITIONS[zone];
                  const node = getNodeByZone(zone);
                  const status = node?.status || 'normal';
                  const color = ZONE_COLORS[status] || '#10b981';
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
                        <circle r={45} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.8} filter="url(#severe-glow)">
                          <animate attributeName="r" values="35;55;35" dur="2s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
                        </circle>
                      )}
                      
                      <circle r={isHovered || isFailed ? 34 : 30}
                        fill={color + '20'} stroke={color}
                        strokeWidth={isFailed ? 3 : 2}
                        filter={isFailed ? "url(#severe-glow)" : "url(#glow)"}
                        className="transition-all duration-300"/>
                        
                      <circle r={isHovered || isFailed ? 28 : 24}
                        fill={`${color}40`} stroke="none"
                        className="transition-all duration-300"/>

                      <text y={-6} textAnchor="middle" fill="white" fontSize={11} fontWeight="800" className="drop-shadow-md">{zone}</text>
                      <text y={12} textAnchor="middle" fill="#f8fafc" fontSize={12} fontWeight="700">{score}</text>
                    </g>
                  );
                })}
              </svg>

              {/* Glassmorphic Tooltip */}
              {hovered && (() => {
                const node = getNodeByZone(hovered);
                if (!node) return null;
                const statusColor = ZONE_COLORS[node.status];
                return (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} 
                    className="absolute top-6 right-6 bg-[#0B1220]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 min-w-[220px] shadow-2xl z-30 pointer-events-none">
                    <p className="font-black text-white text-lg tracking-tight mb-3 border-b border-white/10 pb-2">{hovered}</p>
                    <div className="space-y-2 text-xs font-medium uppercase tracking-widest text-gray-400">
                      <div className="flex justify-between items-center"><span>Score</span><span className="text-white text-sm bg-white/10 px-2 py-0.5 rounded">{node.score}</span></div>
                      <div className="flex justify-between items-center"><span>Population</span><span className="text-gray-300">{(node.population/1e6).toFixed(1)}M</span></div>
                      <div className="flex justify-between items-center"><span>Water Gap</span><span className={node.water_stress > 0 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]':'text-emerald-400'}>{node.water_stress} M.G.D</span></div>
                      <div className="flex justify-between items-center"><span>Status</span><span style={{color: statusColor}} className="drop-shadow-sm font-bold">{node.status}</span></div>
                    </div>
                  </motion.div>
                );
              })()}
            </div>

            {/* Sidebar Data Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Failure Simulation Banner */}
              {failedZone && graphData?.directly_impacted && (
                <motion.div initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x:0 }} 
                  className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-3xl rounded-full"></div>
                  <h3 className="text-red-400 font-bold mb-1 flex items-center gap-2 tracking-wide">
                    <span className="animate-pulse">⚠️</span> CASCADING FAILURE
                  </h3>
                  <p className="text-white text-2xl font-black tracking-tight mb-4">{failedZone} Offline</p>
                  
                  <div className="bg-black/20 rounded-xl p-4 mb-5 border border-red-500/10">
                    <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">System Resilience Dropped To</p>
                    <p className="text-amber-400 font-extrabold text-3xl">{graphData.network_resilience_pct}%</p>
                  </div>

                  <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 border-b border-red-500/20 pb-2">Impacted Sub-Nodes</p>
                  <div className="space-y-3">
                    {Object.entries(graphData.directly_impacted).map(([zone, data]: any) => (
                      <div key={zone} className="flex items-center justify-between border-l-2 border-amber-500 pl-3">
                        <div>
                          <p className="text-white font-bold text-sm tracking-wide">{zone}</p>
                          <p className="text-amber-500/70 text-[10px] uppercase font-bold tracking-wider">{data.impact_type?.replace('_',' ')}</p>
                        </div>
                        <span className="text-red-400 font-mono font-bold text-sm">-{data.reduction_percent}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Status metrics skeleton if no failure */}
              {!failedZone && graphData?.metrics && (
                <motion.div initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x:0 }} className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] mx-auto">
                    <div className="w-8 h-8 rounded-full bg-emerald-400 animate-pulse"></div>
                  </div>
                  <h3 className="text-center text-white font-bold text-xl tracking-wide mb-1">Grid Stable</h3>
                  <p className="text-center text-gray-500 text-sm mb-8">All critical city infrastructure running optimal operations.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(graphData.metrics).map(([k, v]: any) => {
                      if(k==='avg_score') return null;
                      return (
                        <div key={k} className="bg-black/30 border border-white/5 rounded-2xl p-4 text-center hover:bg-white/5 transition-colors">
                          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">{k.replace(/_/g,' ')}</p>
                          <p className="text-white font-black text-xl">{String(v)}</p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'stress' && (
        <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl min-h-[400px]">
          {stressLoading && (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="w-10 h-10 border-4 border-t-white border-white/10 rounded-full animate-spin mb-4"></div>
               <div className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Running 15-Year Extrapolation Matrix...</div>
            </div>
          )}
          {stressData && !stressLoading && (
            <>
              <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight mb-1">15-Year Capacity Exhaustion</h2>
                  <p className="text-gray-500 text-sm">Identifying which zones will break first under climate and population pressure.</p>
                </div>
                <div className="text-right bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sim Parameters</p>
                  <p className="text-white font-mono text-sm">Pop: +{(stressData.growth_rate*100).toFixed(1)}%/yr | Temp: +{stressData.temp_rise_per_year}°C/yr</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {stressData.zones?.map((z: any, i:number) => (
                  <motion.div key={z.zone} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}}
                    className={`rounded-2xl border p-6 relative overflow-hidden group hover:scale-[1.02] transition-all bg-black/40 ${z.overall_risk==='Critical'?'border-red-500/30': z.overall_risk==='High'?'border-amber-500/30':'border-white/5'}`}>
                    
                    {/* Background glow */}
                    {z.overall_risk === 'Critical' && <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-colors"></div>}
                    
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-white font-black text-lg tracking-wide">{z.zone}</h3>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ${z.overall_risk==='Critical'?'bg-red-500/20 text-red-400 ring-1 ring-red-500/50':z.overall_risk==='High'?'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50':'bg-white/10 text-gray-300 ring-1 ring-white/20'}`}>
                        {z.overall_risk}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Water Grid Collapse</p>
                        <p className={`font-mono text-lg font-bold ${z.water_crisis_year ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-emerald-400'}`}>
                          {z.water_crisis_year || 'Stable 15+ Yrs'}
                        </p>
                      </div>
                      <div className="w-full h-px bg-white/5"></div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Waste Process Collapse</p>
                        <p className={`font-mono text-lg font-bold ${z.waste_crisis_year ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-emerald-400'}`}>
                          {z.waste_crisis_year || 'Stable 15+ Yrs'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
