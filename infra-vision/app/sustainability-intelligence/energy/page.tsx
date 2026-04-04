'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sparkles, Sun } from 'lucide-react';
import { getFullData, forecastEnergy, getZones } from '@/lib/sustainabilityApi';

function toNum(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function EnergyPage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [targetZone, setTargetZone] = useState('Central');
  const [renewableTarget, setRenewableTarget] = useState(25);
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
        setError(e instanceof Error ? e.message : 'Unable to load energy data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetZone]);

  useEffect(() => {
    if (!targetZone) return;
    forecastEnergy(targetZone, renewableTarget)
      .then(setForecastResult)
      .catch((e) => {
        setForecastResult(null);
        setError(e instanceof Error ? e.message : 'Unable to load energy forecast');
      });
  }, [targetZone, renewableTarget]);

  const consumptionByZone = zones.map((zone) => {
    const rows = zoneData
      .filter((row: any) => row.zone === zone)
      .sort((a: any, b: any) => toNum(a.year) - toNum(b.year));
    const latest = rows[rows.length - 1];
    if (!latest) return { zone, energy: 0, renewable: 0, solar: 0 };
    return {
      zone,
      energy: toNum(latest.energy_consumption_mu),
      renewable: toNum(latest.renewable_share_percent),
      solar: toNum(latest.solar_capacity_mw),
    };
  });

  const solarPriorityData = consumptionByZone
    .map((zone) => ({
      ...zone,
      solar_score: zone.energy > 0 ? (zone.solar / zone.energy) * 1000 : 0,
    }))
    .sort((a, b) => b.solar_score - a.solar_score);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-amber-400 border-r-amber-700 animate-spin" />
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Initializing Grid Models</div>
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
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fcd34d] animate-pulse" />
          <p className="text-sm text-amber-400/80 font-semibold tracking-widest uppercase">Energy Transition Domain</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 tracking-tight">
          Solar Capacity Planning
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col"
        >
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
                <XAxis dataKey="zone" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} dx={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="energy" name="Total Energy (MU)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="renewable" name="Renewable %" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} />
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1 relative z-10">02 / Forecast Engine</p>
          <h2 className="text-xl font-semibold text-white tracking-tight mb-6 relative z-10">Renewable Simulator</h2>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Target Region</label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-amber-500/50"
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone} className="bg-[#0B1220]">
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Policy Mandate (Renewable %)</label>
              <select
                value={renewableTarget}
                onChange={(e) => setRenewableTarget(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-amber-500/50"
              >
                <option value={25} className="bg-[#0B1220]">25% Baseline Expansion</option>
                <option value={50} className="bg-[#0B1220]">50% Aggressive Tranche</option>
                <option value={75} className="bg-[#0B1220]">75% Extreme Transition</option>
              </select>
            </div>
          </div>

          {forecastResult ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex-1 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5 shadow-inner">
              <h3 className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Cost Output
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">New Solar Req.</span>
                  <span className="text-amber-400 font-mono font-bold">{toNum(forecastResult.solar_mw_needed).toFixed(1)} MW</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">CO2 Abatement</span>
                  <span className="text-emerald-400 font-mono font-bold">-{toNum(forecastResult.ghg_reduction_mtco2).toFixed(1)} MT</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Est. Capital</span>
                  <span className="text-white font-mono font-bold">INR {toNum(forecastResult.cost_estimate_cr).toFixed(1)} Cr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Time Horizon</span>
                  <span className="text-white font-mono font-bold">{toNum(forecastResult.years_to_achieve)} Yrs</span>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Strategic Execution</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Deployment Priority Index</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {solarPriorityData.map((zone, i) => (
            <motion.div
              key={zone.zone}
              whileHover={{ scale: 1.03 }}
              className="relative p-5 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  RANK {i + 1}
                </span>
                <Sun className="w-4 h-4 text-emerald-400/50" />
              </div>
              <p className="text-lg font-bold text-white mb-1 relative z-10">{zone.zone}</p>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Score</span>
                <span className="text-emerald-400 font-mono text-sm">{zone.solar_score.toFixed(0)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
