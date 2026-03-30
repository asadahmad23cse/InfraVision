'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { Zap, Sun, TrendingUp, Sparkles, BatteryCharging, ArrowRight } from 'lucide-react';
import { getFullData, forecastEnergy, getZones } from '@/lib/sustainabilityApi';

export default function EnergyPage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [targetZone, setTargetZone] = useState('Central');
  const [renewableTarget, setRenewableTarget] = useState(25);
  const [forecastResult, setForecastResult] = useState<any>(null);
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

  useEffect(() => {
    if (!targetZone) return;
    forecastEnergy(targetZone, renewableTarget).then(setForecastResult);
  }, [targetZone, renewableTarget]);

  const consumptionByZone = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, energy: 0, renewable: 0 };
    return {
      zone: z,
      energy: latest.energy_consumption_mu || 0,
      renewable: latest.renewable_share_percent || 0,
      solar: latest.solar_capacity_mw || 0,
    };
  });

  const solarPriorityData = consumptionByZone.map((z) => ({
    ...z,
    solar_score: z.energy > 0 ? (z.solar / z.energy) * 1000 : 0,
  })).sort((a, b) => b.solar_score - a.solar_score);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-amber-400 border-r-amber-700 animate-spin"></div>
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Initializing Grid Models</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fcd34d] animate-pulse"></div>
          <p className="text-sm text-amber-400/80 font-semibold tracking-widest uppercase">Energy Transition Domain</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 tracking-tight">
          Solar Capacity Planning
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          Delhi consumes ~36,000 MU/year with a solar footprint of exactly &lt; 3%. Compute immediate high-impact spatial deployments to maximize CapEx returns.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Step 1: The Grid Status */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">01 / Grid Topology</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Consumption vs Renewable Footprint</h2>
            </div>
          </div>

          <div className="flex-1 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionByZone} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="zone" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dx={-10} />
                <YAxis yAxisId="right" orientation="right" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dx={10} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff', fontWeight: 600}}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                <Bar yAxisId="left" dataKey="energy" name="Total Energy (MU)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.4))' }} />
                <Bar yAxisId="right" dataKey="renewable" name="Renewable %" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.4))' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Step 2: Policy Simulator */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative group overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none transition-colors"></div>
          
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1 relative z-10">02 / Forecast Engine</p>
          <h2 className="text-xl font-semibold text-white tracking-tight mb-6 relative z-10">Renewable Simulator</h2>

          <div className="space-y-5 relative z-10">
            <div className="group/dropdown">
              <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Target Region</label>
              <div className="relative">
                <select value={targetZone} onChange={e => setTargetZone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium appearance-none outline-none focus:border-amber-500/50 transition-all cursor-pointer">
                  {zones.map(z => <option key={z} value={z} className="bg-[#0B1220]">{z}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>
            
            <div className="group/dropdown">
              <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Policy Mandate (Renewable %)</label>
              <div className="relative">
                <select value={renewableTarget} onChange={e => setRenewableTarget(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium appearance-none outline-none focus:border-amber-500/50 transition-all cursor-pointer">
                  <option value={25} className="bg-[#0B1220]">25% Baseline Expansion</option>
                  <option value={50} className="bg-[#0B1220]">50% Aggressive Tranche</option>
                  <option value={75} className="bg-[#0B1220]">75% Extreme Transition</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>
          </div>

          {forecastResult ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex-1 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5 shadow-inner">
              <h3 className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-3 h-3"/> Cost Output</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">New Solar Req.</span>
                  <span className="text-amber-400 font-mono font-bold">{forecastResult.solar_mw_needed.toFixed(1)} MW</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">CO₂ Abatement</span>
                  <span className="text-emerald-400 font-mono font-bold">-{forecastResult.ghg_reduction_mtco2.toFixed(1)} MT</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Est. Capital</span>
                  <span className="text-white font-mono font-bold">₹{forecastResult.cost_estimate_cr.toFixed(1)} Cr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Time Horizon</span>
                  <span className="text-white font-mono font-bold">{forecastResult.years_to_achieve} Yrs</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mt-6 flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40 text-sm">Evaluating matrix...</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Step 3: Deployment Priority */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Strategic Execution</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Deployment Priority Index</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {solarPriorityData.map((z, i) => (
            <motion.div key={z.zone} whileHover={{ scale: 1.03 }}
              className="relative p-5 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  RANK {i + 1}
                </span>
                <Sun className="w-4 h-4 text-emerald-400/50" />
              </div>
              
              <p className="text-lg font-bold text-white mb-1 relative z-10">{z.zone}</p>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Score</span>
                <span className="text-emerald-400 font-mono text-sm">{z.solar_score.toFixed(0)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
