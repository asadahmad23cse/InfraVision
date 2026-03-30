'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { TreePine, Thermometer, MapPin, Activity, HelpCircle, ArrowRight } from 'lucide-react';
import { getFullData, getZones } from '@/lib/sustainabilityApi';

const WHO_TARGET = 9; // sqm per person

export default function GreenSpacePage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [full, zonesRes] = await Promise.all([getFullData(), getZones()]);
        setZones(zonesRes.zones || []);
        setZoneData(full.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greenData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, green_sqkm: 0, tree_pct: 0, built: 0, pop: 0, score: 0, heat_risk: 'low', sqm_capita: 0, gap_to_who: WHO_TARGET };
    const pop = latest.population || 1;
    const green = latest.green_space_sqkm || 0;
    const sqmCapita = (green * 1e6) / pop;
    const score = green * 0.5 + (latest.tree_cover_percent || 0) * 0.3;
    const heatRisk = (latest.built_up_density_percent || 0) > 80 && score < 15 ? 'critical' :
      (latest.built_up_density_percent || 0) > 70 && score < 20 ? 'high' :
      (latest.built_up_density_percent || 0) > 60 ? 'medium' : 'low';
    return {
      zone: z,
      green_sqkm: green,
      tree_pct: latest.tree_cover_percent || 0,
      built: latest.built_up_density_percent || 0,
      pop,
      score: Math.min(100, score * 2),
      heat_risk: heatRisk,
      sqm_capita: sqmCapita,
      gap_to_who: Math.max(0, WHO_TARGET - sqmCapita),
    };
  }).sort((a,b) => b.gap_to_who - a.gap_to_who);

  const heatRiskColors: Record<string, string> = {
    critical: '#fb7185', // rose-400
    high: '#fbbf24',     // amber-400
    medium: '#fcd34d',   // amber-300
    low: '#34d399',      // emerald-400
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-emerald-400 border-r-lime-400 animate-spin"></div>
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Scanning Bio-Grid...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></div>
          <p className="text-sm text-emerald-400/80 font-semibold tracking-widest uppercase">Canopy & Micro-Climate</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-lime-400 to-green-300 tracking-tight">
          Urban Heat Island Intelligence
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          Delhi's green cover falls short of the WHO 9m² mandate in critical dense grids. Evaluate heat retention zones to execute strategic reforestation interventions.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Step 1: Health Deficit (WHO Target) */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">01 / Structural Deficit</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Canopy Cover vs. WHO Mandate (9 m²/capita)</h2>
            </div>
          </div>

          <div className="flex-1 space-y-4 pr-2 overflow-y-auto max-h-[350px] custom-scrollbar">
            {greenData.map((z) => (
              <div key={z.zone} className="flex flex-col gap-2 group">
                <div className="flex justify-between items-end">
                  <span className="text-white/80 font-medium text-sm">{z.zone}</span>
                  <span className="text-white/40 font-mono text-xs">{z.sqm_capita.toFixed(1)} m² <span className="text-white/20">/ 9.0 m² target</span></span>
                </div>
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                  <div className="flex h-full">
                    {/* Actual Coverage */}
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_#34d399]"
                      style={{ width: `${Math.min(100, (z.sqm_capita / WHO_TARGET) * 100)}%` }} />
                    {/* Deficit */}
                    <div className="h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-rose-500/30 overflow-hidden relative"
                      style={{ width: `${Math.min(100, ((z.gap_to_who ?? 0) / WHO_TARGET) * 100)}%` }}>
                        <div className="absolute inset-0 bg-rose-500/20 animate-pulse"></div>
                      </div>
                  </div>
                  {/* WHO Marker */}
                  <div className="absolute top-0 bottom-0 w-px bg-white" style={{left: '100%'}}></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step 2: Heat Island Matrix */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative group overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none transition-colors"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">02 / Thermal Risk</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><Thermometer className="w-4 h-4 text-rose-400"/> Microclimate Matrix</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {greenData.map((z) => {
              const isActive = selectedZone === z.zone;
              return (
                <motion.button
                  key={z.zone}
                  onClick={() => setSelectedZone(isActive ? null : z.zone)}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group hover:scale-[1.03] ${
                    isActive ? 'border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-white/5 hover:border-white/20'
                  }`}
                  style={{ backgroundColor: `${heatRiskColors[z.heat_risk]}20` }}
                >
                  <div className={`absolute -right-2 -bottom-2 w-10 h-10 rounded-full blur-xl opacity-40`} style={{backgroundColor: heatRiskColors[z.heat_risk]}}></div>
                  <span className="font-semibold text-white text-sm block mb-1">{z.zone}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: heatRiskColors[z.heat_risk]}}></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: heatRiskColors[z.heat_risk] }}>
                      {z.heat_risk}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Step 3: Green Quality Index */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Quality Metric</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Canopy & Biodiversity Score</h2>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={greenData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="zone" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dx={-10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff', fontWeight: 600}}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="score" name="Green Health Score" radius={[4, 4, 0, 0]} barSize={24}>
                  {greenData.map((entry, i) => (
                    <Cell key={i} fill={heatRiskColors[entry.heat_risk] || '#64748b'} 
                          style={{ filter: `drop-shadow(0 0 6px ${heatRiskColors[entry.heat_risk]}60)`}} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Step 4: Spatial Recommender */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none transition-colors"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">04 / Tactical Output</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">Spatial Allocation Recommender</h2>
            </div>
            {selectedZone && <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest text-[10px] rounded-lg">{selectedZone}</span>}
          </div>

          <div className="flex-1 relative z-10 flex flex-col">
            {selectedZone ? (() => {
              const z = greenData.find((x) => x.zone === selectedZone);
              if (!z) return null;
              const areaNeeded = ((z.gap_to_who ?? 0) * z.pop) / 1e6;
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col justify-center gap-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-5 rounded-xl border border-emerald-500/20 shadow-inner">
                      <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400"/> Land Acquisition Target</p>
                      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300">
                        {areaNeeded.toFixed(2)} <span className="text-xs font-normal text-emerald-400/50">sq km</span>
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-500/10 to-transparent p-5 rounded-xl border border-cyan-500/20 shadow-inner">
                      <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-1"><Thermometer className="w-3 h-3 text-cyan-400"/> Projected Heat Drop</p>
                      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">
                        -{z.heat_risk === 'critical' ? '2.0' : z.heat_risk === 'high' ? '1.5' : '1.0'}°C
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Intervention Priority</span>
                      <span className="text-white font-mono font-bold">{(100 - z.score).toFixed(0)} <span className="text-[10px] text-white/30">/ 100</span></span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Population Health Uplift</span>
                      <span className="text-emerald-400 font-mono font-bold">+{(Math.min(100, (z.gap_to_who ?? 0) * 5)).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                </motion.div>
              );
            })() : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-4">
                  <TreePine className="w-6 h-6 text-emerald-400/50" />
                </div>
                <p className="text-sm text-white/80 font-medium tracking-wide">Select a Zone Matrix</p>
                <p className="text-xs text-white/40 mt-1 max-w-[220px]">Click a cell in the Thermal Risk matrix above to generate an actionable reforestation blueprint.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
