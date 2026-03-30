'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { Recycle, AlertTriangle, ArrowRight, Sparkles, Filter, Trash2 } from 'lucide-react';
import { getFullData, forecastWaste, getZones } from '@/lib/sustainabilityApi';

export default function WastePage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [targetZone, setTargetZone] = useState('East');
  const [recyclingTarget, setRecyclingTarget] = useState(20);
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
    forecastWaste(targetZone, recyclingTarget).then(setForecastResult);
  }, [targetZone, recyclingTarget]);

  const zoneWasteData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, generated: 0, processed: 0, landfill: 0, ce_index: 0 };
    const gen = latest.waste_generated_tpd || 0;
    const proc = latest.waste_processed_tpd || 0;
    const landfill = (gen * (latest.landfill_dependency_percent || 50)) / 100;
    const ce = gen > 0 ? (proc / gen) * 100 : 0;
    return { zone: z, generated: gen, processed: proc, landfill, ce_index: ce };
  });

  const topInterventionZones = zoneWasteData.filter((z) => z.landfill > 500).sort((a,b) => b.landfill - a.landfill).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-violet-400 border-r-fuchsia-700 animate-spin"></div>
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Calculating Circular Economy Math</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_10px_#a78bfa] animate-pulse"></div>
          <p className="text-sm text-violet-400/80 font-semibold tracking-widest uppercase">Waste Management Domain</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 tracking-tight">
          Circular Economy Optimization
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          ~11,000 TPD generated with 49% leaking to landfills. Trace the generation-to-processing delta and isolate regions requiring immediate intervention logic.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Step 1: The Matrix */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">01 / Volume Analysis</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Generated vs Processed (TPD)</h2>
            </div>
          </div>

          <div className="flex-1 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneWasteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="zone" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff', fontWeight: 600}}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                <Bar dataKey="generated" name="Total Generated" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={14} style={{ filter: 'drop-shadow(0 0 6px rgba(251,113,133,0.3))' }} />
                <Bar dataKey="processed" name="Successfully Processed" fill="#34d399" radius={[4, 4, 0, 0]} barSize={14} style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.3))' }} />
                <Bar dataKey="landfill" name="Leaked to Landfill" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={14} style={{ filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.3))' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Step 2: The Risk Target */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative group overflow-hidden flex flex-col">
          <div className="absolute top-0 -right-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none transition-colors"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">02 / Intervention Map</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-400"/> Critical Vectors</h2>
            </div>
          </div>

          <div className="flex-1 space-y-4 relative z-10">
            {topInterventionZones.length > 0 ? topInterventionZones.map((z, i) => (
              <div key={z.zone} className="p-4 bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 rounded-xl relative overflow-hidden group hover:bg-rose-500/20 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold tracking-wide">{z.zone}</span>
                  <span className="text-rose-400 font-black text-xs px-2 py-0.5 bg-rose-500/20 rounded border border-rose-500/30">RANK #{i+1}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 uppercase tracking-widest font-semibold">Landfill Leak</span>
                    <span className="text-rose-400 font-mono font-bold font-black">{z.landfill.toFixed(0)} TPD</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 uppercase tracking-widest font-semibold">CE Deficit (To 80%)</span>
                    <span className="text-white/70 font-mono">-{((80 - z.ce_index)>0?(80-z.ce_index):0).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/20">
                <p className="text-white/40 text-sm">No critical interventions flagged.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 3: Circular Economy Index */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Target Progress</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Circular Economy Index vs 80% Target</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
            </div>
          </div>

          <div className="space-y-5">
            {zoneWasteData.map((z) => (
              <div key={z.zone} className="flex items-center gap-4 group">
                <span className="w-24 text-white/70 font-medium text-sm group-hover:text-white transition-colors">{z.zone}</span>
                <div className="flex-1 h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                  <div
                    className={`absolute rounded-full h-full transition-all duration-1000 ${z.ce_index >= 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : z.ce_index >= 50 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                    style={{ width: `${Math.min(100, z.ce_index)}%` }}
                  />
                  {/* Reference line for 80% */}
                  <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{left: '80%'}}></div>
                </div>
                <span className={`w-12 text-sm font-black font-mono tracking-tighter ${z.ce_index >= 80 ? 'text-emerald-400' : z.ce_index >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {z.ce_index.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step 4: Recycling Forecaster */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">04 / Trajectory Engine</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">Recycling Impact Forecaster</h2>
            </div>
            <Recycle className="w-5 h-5 text-violet-400" />
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6 relative z-10 w-full">
            <div className="flex-1">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 block">Target Region</label>
              <div className="relative">
                <select value={targetZone} onChange={e => setTargetZone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium appearance-none outline-none focus:border-violet-500/50 transition-all cursor-pointer">
                  {zones.map(z => <option key={z} value={z} className="bg-[#0B1220]">{z}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 block">Efficiency CapEx Increase</label>
              <div className="relative">
                <select value={recyclingTarget} onChange={e => setRecyclingTarget(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium appearance-none outline-none focus:border-violet-500/50 transition-all cursor-pointer">
                  {[10, 20, 30, 40, 50].map((v) => <option key={v} value={v} className="bg-[#0B1220]">+{v}% Output Vector</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>
          </div>

          {forecastResult ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-2xl p-6 shadow-inner flex flex-col justify-center">
               <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><Trash2 className="w-3 h-3 text-emerald-400"/> Landfill Decline</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">-{forecastResult.landfill_reduction_tpd.toFixed(0)} <span className="text-sm font-normal text-emerald-400/50">TPD</span></p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">GHG Offset</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">-{forecastResult.ghg_savings_mtco2.toFixed(1)} <span className="text-sm font-normal text-cyan-400/50">MT</span></p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Projected CE Index</p>
                  <p className="text-2xl font-bold text-white shadow-sm">{forecastResult.projected_ce_index.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Execution Horizon</p>
                  <p className="text-2xl font-bold text-white shadow-sm">{forecastResult.years_to_achieve} Yrs</p>
                </div>
              </div>
            </motion.div>
          ) : (
             <div className="mt-6 flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-black/20">
              <p className="text-white/40 text-sm">Evaluating matrix...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
