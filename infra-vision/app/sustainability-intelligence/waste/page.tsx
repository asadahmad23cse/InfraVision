'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Recycle, Trash2 } from 'lucide-react';
import { forecastWaste, getFullData, getZones } from '@/lib/sustainabilityApi';

function toNum(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function WastePage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [targetZone, setTargetZone] = useState('East');
  const [recyclingTarget, setRecyclingTarget] = useState(20);
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [full, zonesRes] = await Promise.all([getFullData(), getZones()]);
        const loadedZones = zonesRes.zones || [];
        setZones(loadedZones);
        setZoneData(full.data || []);
        if (loadedZones.length > 0 && !loadedZones.includes(targetZone)) {
          setTargetZone(loadedZones[0]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load waste data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetZone]);

  useEffect(() => {
    if (!targetZone) return;
    forecastWaste(targetZone, recyclingTarget)
      .then(setForecastResult)
      .catch((e) => {
        setForecastResult(null);
        setError(e instanceof Error ? e.message : 'Unable to load waste forecast');
      });
  }, [targetZone, recyclingTarget]);

  const zoneWasteData = zones.map((zone) => {
    const rows = zoneData
      .filter((row: any) => row.zone === zone)
      .sort((a: any, b: any) => toNum(a.year) - toNum(b.year));
    const latest = rows[rows.length - 1];
    if (!latest) return { zone, generated: 0, processed: 0, landfill: 0, ce_index: 0 };
    const generated = toNum(latest.waste_generated_tpd);
    const processed = toNum(latest.waste_processed_tpd);
    const landfill = (generated * toNum(latest.landfill_dependency_percent, 50)) / 100;
    const ceIndex = generated > 0 ? (processed / generated) * 100 : 0;
    return { zone, generated, processed, landfill, ce_index: ceIndex };
  });

  const topInterventionZones = zoneWasteData
    .filter((zone) => zone.landfill > 500)
    .sort((a, b) => b.landfill - a.landfill)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-violet-400 border-r-fuchsia-700 animate-spin" />
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Calculating Circular Economy Math</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_10px_#a78bfa] animate-pulse" />
          <p className="text-sm text-violet-400/80 font-semibold tracking-widest uppercase">Waste Management Domain</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 tracking-tight">
          Circular Economy Optimization
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col"
        >
          <div className="mb-6">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">01 / Volume Analysis</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Generated vs Processed (TPD)</h2>
          </div>
          <div className="flex-1 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneWasteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="zone" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="generated" name="Total Generated" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="processed" name="Successfully Processed" fill="#34d399" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="landfill" name="Leaked to Landfill" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col"
        >
          <div className="absolute top-0 -right-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">02 / Intervention Map</p>
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Critical Vectors
            </h2>
          </div>

          <div className="flex-1 space-y-4 mt-6 relative z-10">
            {topInterventionZones.length > 0 ? (
              topInterventionZones.map((zone, i) => (
                <div key={zone.zone} className="p-4 bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold tracking-wide">{zone.zone}</span>
                    <span className="text-rose-400 font-black text-xs px-2 py-0.5 bg-rose-500/20 rounded border border-rose-500/30">RANK #{i + 1}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 uppercase tracking-widest font-semibold">Landfill Leak</span>
                    <span className="text-rose-400 font-mono font-bold">{zone.landfill.toFixed(0)} TPD</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/20">
                <p className="text-white/40 text-sm">No critical interventions flagged.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
        >
          <div className="mb-8">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Target Progress</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Circular Economy Index vs 80% Target</h2>
          </div>
          <div className="space-y-5">
            {zoneWasteData.map((zone) => (
              <div key={zone.zone} className="flex items-center gap-4">
                <span className="w-24 text-white/70 font-medium text-sm">{zone.zone}</span>
                <div className="flex-1 h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                  <div
                    className={`absolute rounded-full h-full ${
                      zone.ce_index >= 80
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        : zone.ce_index >= 50
                        ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                        : 'bg-gradient-to-r from-rose-600 to-rose-400'
                    }`}
                    style={{ width: `${Math.min(100, zone.ce_index)}%` }}
                  />
                  <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '80%' }} />
                </div>
                <span className="w-12 text-sm font-black font-mono text-emerald-300">{zone.ce_index.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">04 / Trajectory Engine</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Recycling Impact Forecaster</h2>
            </div>
            <Recycle className="w-5 h-5 text-violet-400" />
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6 w-full">
            <div className="flex-1">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 block">Target Region</label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-violet-500/50"
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone} className="bg-[#0B1220]">
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 block">Efficiency Increase</label>
              <select
                value={recyclingTarget}
                onChange={(e) => setRecyclingTarget(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-violet-500/50"
              >
                {[10, 20, 30, 40, 50].map((value) => (
                  <option key={value} value={value} className="bg-[#0B1220]">
                    +{value}% Output Vector
                  </option>
                ))}
              </select>
            </div>
          </div>

          {forecastResult ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-2xl p-6 shadow-inner flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                    <Trash2 className="w-3 h-3 text-emerald-400" />
                    Landfill Decline
                  </p>
                  <p className="text-3xl font-black text-emerald-300">-{toNum(forecastResult.landfill_reduction_tpd).toFixed(0)} TPD</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">GHG Offset</p>
                  <p className="text-3xl font-black text-cyan-300">-{toNum(forecastResult.ghg_savings_mtco2).toFixed(1)} MT</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Projected CE Index</p>
                  <p className="text-2xl font-bold text-white">{toNum(forecastResult.projected_ce_index).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Execution Horizon</p>
                  <p className="text-2xl font-bold text-white">{toNum(forecastResult.years_to_achieve)} Yrs</p>
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
