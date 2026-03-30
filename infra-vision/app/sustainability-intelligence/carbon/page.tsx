'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine,
} from 'recharts';
import { Flame, Target, TrendingDown, Leaf, Goal, ArrowRight } from 'lucide-react';
import { getFullData, getZones } from '@/lib/sustainabilityApi';

const BASELINE_YEAR = 2015;
const NET_ZERO_YEAR = 2070;

export default function CarbonPage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
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

  const emissionsByZone = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, energy: 0, transport: 0, waste: 0, total: 0 };
    const energy = (latest.ghg_emissions_mtco2 || 0) * 0.6;
    const transport = latest.transport_emissions_mtco2 || 0;
    const waste = latest.waste_emissions_mtco2 || 0;
    return { zone: z, energy, transport, waste, total: energy + transport + waste };
  });

  const yearlyTotal = Object.entries(
    zoneData.reduce((acc: Record<number, number>, r: any) => {
      acc[r.year] = (acc[r.year] || 0) + (r.ghg_emissions_mtco2 || 0) + (r.transport_emissions_mtco2 || 0) + (r.waste_emissions_mtco2 || 0);
      return acc;
    }, {})
  ).map(([year, total]) => ({ year: Number(year), total })).sort((a, b) => a.year - b.year);

  const baselineEmissions = yearlyTotal.find((d) => d.year === BASELINE_YEAR)?.total || 55;
  const reductionNeededPerYear = baselineEmissions / (NET_ZERO_YEAR - BASELINE_YEAR);
  const currentEmissions = yearlyTotal[yearlyTotal.length - 1]?.total || baselineEmissions;
  const progressPercent = Math.min(100, Math.max(0, ((baselineEmissions - currentEmissions) / baselineEmissions) * 100));

  const scenarioData = yearlyTotal.map((d) => ({
    ...d,
    baseline: d.total,
    moderate: d.total * Math.pow(0.97, Math.max(0, d.year - 2022)),
    aggressive: d.total * Math.pow(0.95, Math.max(0, d.year - 2022)),
  })).filter((d) => d.year <= 2030);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-emerald-400 border-r-teal-700 animate-spin"></div>
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Running Climate Models</div>
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
          <p className="text-sm text-emerald-400/80 font-semibold tracking-widest uppercase">Climate Transition Domain</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 tracking-tight">
          Carbon Abatement Intelligence
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          Aligning Delhi's infrastructure footprint with India's aggressive 2070 Net-Zero mandate. Monitor structural emissions and visualize decarbonization pathways.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Step 1: Breakdown Matrix */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">01 / Scope Analysis</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Zone-wise Structural Emissions (MT CO₂e)</h2>
            </div>
            <Leaf className="w-5 h-5 text-emerald-400 opacity-80" />
          </div>

          <div className="flex-1 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emissionsByZone} layout="vertical" margin={{ left: 20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="zone" stroke="#94a3b8" tick={{ fill: 'white', fontSize: 11, fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff', fontWeight: 600}}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                <Bar dataKey="energy" stackId="a" name="Grid Power" fill="#fbbf24" radius={[0, 0, 0, 0]} barSize={20} />
                <Bar dataKey="transport" stackId="a" name="Transport Vectors" fill="#38bdf8" radius={[0, 0, 0, 0]} barSize={20} />
                <Bar dataKey="waste" stackId="a" name="Landfill Degassing" fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Step 2: Net Zero Tracker */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative group overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none transition-colors"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">02 / Macrostates</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><Goal className="w-5 h-5 text-emerald-400"/> Net-Zero 2070 Vector</h2>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Baseline Footprint (2015)</p>
              <p className="text-3xl font-black text-white">{baselineEmissions.toFixed(1)} <span className="text-sm font-normal text-white/50">MT CO₂e</span></p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-white/60 text-sm font-medium">Trajectory Progress</span>
                <span className="text-emerald-400 font-mono font-bold text-lg">{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-black/40 rounded-full border border-white/5 overflow-hidden shadow-inner relative">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Required Annual Delta</p>
                <p className="text-white font-mono text-lg font-bold">-{reductionNeededPerYear.toFixed(2)} <span className="text-xs text-white/50">MT/yr</span></p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Step 3: Trajectory Modeler */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Simulation Envelope</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Aggressive Deflation Geometries (2015–2030)</h2>
            <p className="text-sm text-white/50 mt-1">Comparing moderate vs extreme policy implementation trajectories.</p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scenarioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="baseLineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="modLineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fcd34d" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fcd34d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="aggLineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="year" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dx={-10} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                itemStyle={{fontWeight: 600}}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
              
              <ReferenceLine x={2022} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" label={{value:'Now', fill:'rgba(255,255,255,0.5)', fontSize:10, position: 'top'}} />
              
              <Area type="monotone" dataKey="baseline" name="Inaction Baseline" stroke="#fb7185" strokeWidth={2} fill="url(#baseLineGlow)" activeDot={{r: 6}} />
              <Area type="monotone" dataKey="moderate" name="Moderate Cap (-3%/yr)" stroke="#fbbf24" strokeWidth={2} fill="url(#modLineGlow)" activeDot={{r: 6}} />
              <Area type="monotone" dataKey="aggressive" name="Aggressive Phasedown (-5%/yr)" stroke="#34d399" strokeWidth={3} fill="url(#aggLineGlow)" style={{filter: 'drop-shadow(0 4px 6px rgba(52,211,153,0.3))'}} activeDot={{r: 6, strokeWidth: 0}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
