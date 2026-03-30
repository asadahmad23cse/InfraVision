'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Area, AreaChart
} from 'recharts';
import { Droplets, Zap, Recycle, TreePine, Flame, Target, AlertTriangle, CheckCircle, Sparkles, Activity } from 'lucide-react';
import { getOverview, getFullData, type OverviewResponse, type SustainabilityRow } from '@/lib/sustainabilityApi';

const RISK_COLORS: Record<string, string> = {
  critical: '#fb7185', // rose-400
  high: '#fbbf24',     // amber-400
  moderate: '#fcd34d', // amber-300
  safe: '#34d399',     // emerald-400
};

function getWaterRisk(gapPct: number) {
  if (gapPct >= 30) return 'critical';
  if (gapPct >= 15) return 'high';
  if (gapPct >= 5) return 'moderate';
  return 'safe';
}

function getWasteRisk(landfillPct: number) {
  if (landfillPct > 50) return 'critical';
  if (landfillPct > 30) return 'high';
  if (landfillPct > 15) return 'moderate';
  return 'safe';
}

export default function SustainabilityOverviewPage() {
  const [year, setYear] = useState(2022);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ov, full] = await Promise.all([
          getOverview(year),
          getFullData(undefined, undefined),
        ]);
        setOverview(ov);
        const byYear = (full.data || []).reduce((acc: Record<number, any>, r: SustainabilityRow) => {
          const y = r.year;
          if (!acc[y]) acc[y] = { year: y, water_gap: 0, renewable_sum: 0, waste_gen: 0, waste_proc: 0, ghg: 0, score: 0, count: 0, energy: 0 };
          acc[y].water_gap += (r.water_demand_mgd || 0) - (r.water_supply_mgd || 0);
          acc[y].renewable_sum += (r.renewable_share_percent || 0) * (r.energy_consumption_mu || 0);
          acc[y].energy += r.energy_consumption_mu || 0;
          acc[y].waste_gen += r.waste_generated_tpd || 0;
          acc[y].waste_proc += r.waste_processed_tpd || 0;
          acc[y].ghg += r.ghg_emissions_mtco2 || 0;
          acc[y].score += r.sustainability_score || 0;
          acc[y].count += 1;
          return acc;
        }, {});
        
        setTrendData(
          Object.entries(byYear)
            .map(([y, v]: any) => ({
              year: Number(y),
              water_gap: Math.max(0, v.water_gap),
              renewable: v.energy > 0 ? (v.renewable_sum / v.energy) : 0,
              waste_rate: v.waste_gen > 0 ? (v.waste_proc / v.waste_gen) * 100 : 0,
              ghg: v.ghg,
              score: v.count ? v.score / v.count : 0,
            }))
            .sort((a, b) => a.year - b.year)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-cyan-400 border-r-purple-400 animate-spin"></div>
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Initializing Command Center</div>
        </div>
      </div>
    );
  }

  const zoneChartData = (overview.zone_data || []).map((z: any) => {
    const gapPct = z.water_demand_mgd > 0 ? ((z.water_demand_mgd - z.water_supply_mgd) / z.water_demand_mgd) * 100 : 0;
    return {
      zone: z.zone,
      score: z.sustainability_score,
      water_risk: getWaterRisk(gapPct),
      waste_risk: getWasteRisk(z.landfill_dependency_percent || 0),
    };
  });

  const getSystemStatus = () => {
    if (overview.city_sustainability_score < 40) return { label: 'CRITICAL', color: 'rose-400', glow: 'shadow-rose-500/50' };
    if (overview.city_sustainability_score < 60) return { label: 'DEGRADED', color: 'amber-400', glow: 'shadow-amber-500/50' };
    return { label: 'OPTIMAL', color: 'emerald-400', glow: 'shadow-emerald-500/50' };
  };
  const sysObj = getSystemStatus();

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-2.5 h-2.5 rounded-full bg-${sysObj.color} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
            <p className="text-sm text-white/50 font-semibold tracking-widest uppercase">System Status: <span className={`text-${sysObj.color}`}>{sysObj.label}</span></p>
          </div>
          <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 tracking-tight">
            Sustainability Overview
          </h1>
          <p className="text-lg text-white/80 mt-1 font-light">
            Delhi Smart City — Macro Intelligence & Resource Distribution
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-lg border border-white/10 p-2 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
          <span className="text-white/50 text-sm font-medium pl-3">Timeline</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-medium appearance-none outline-none focus:border-cyan-500/50 transition-all min-w-[100px] cursor-pointer"
          >
            {Array.from({ length: 16 }, (_, i) => 2015 + i).map((y) => (
              <option key={y} value={y} className="bg-[#0B1220]">{y}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* AI Insight Box */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl relative overflow-hidden flex items-start gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-inner">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white text-lg font-semibold mb-1 flex items-center gap-2">AI Synthesized Insight <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 uppercase tracking-widest border border-cyan-500/30">Auto-Generated</span></h3>
          <p className="text-white/70 text-sm leading-relaxed max-w-4xl">
            {overview.city_sustainability_score < 50 
              ? "Critical intervention needed. The aggregate composite score sits precariously low, driven primarily by acute structural deficits in water distribution (supply/demand delta) and landfill overflow. Immediate capital allocation is recommended into the South-West nodes."
              : "System performing adequately. Renewable energy vectors have stabilized GHG footprints, though localized water stress matrices in the Eastern sectors require proactive mitigation to prevent network cascade failures by 2028."}
          </p>
        </div>
      </motion.div>

      {/* KPI Core Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Composite Index', value: overview.city_sustainability_score.toFixed(1), icon: Target,  color: 'emerald-400', glow: 'from-emerald-500/20 to-transparent' },
          { label: 'GHG Footprint',   value: `${overview.ghg_emissions_mtco2} Mt`,    icon: Flame,   color: 'rose-400',    glow: 'from-rose-500/20 to-transparent' },
          { label: 'Water Deficit',   value: `${Math.round(overview.water_gap_mgd)} MGD`, icon: Droplets, color: 'cyan-400',    glow: 'from-cyan-500/20 to-transparent' },
          { label: 'Clean Energy',    value: `${overview.renewable_share_percent}%`, icon: Zap,      color: 'amber-400',   glow: 'from-amber-500/20 to-transparent' }
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (i * 0.1) }}
            className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:scale-[1.02] hover:border-white/20 transition-all duration-300 overflow-hidden cursor-default">
            {/* Soft background glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${k.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm text-white/50 font-medium tracking-wide">{k.label}</p>
                <k.icon className={`w-5 h-5 text-${k.color} drop-shadow-[0_0_8px_currentColor]`} />
              </div>
              <p className={`text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70`}>
                {k.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Longitudinal Trajectory Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">Longitudinal Ecosystem Trajectory</h2>
              <p className="text-sm text-white/50 mt-1">15-year composite score evolution normalized across all zones</p>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs text-white/70 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-400" /> Live Aggregation
            </div>
          </div>
          
          <div className="h-80 w-full relative">
            {trendData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-t-cyan-400 animate-spin"></div></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} axisLine={false} tickLine={false} dx={-10} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                    itemStyle={{color: '#fff', fontWeight: 600}}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <ReferenceLine x={year} stroke="#cyan-400" strokeOpacity={0.4} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{r: 6, strokeWidth: 0, fill: '#c084fc', style:{filter:'drop-shadow(0 0 8px rgba(192,132,252,0.8))'}}} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Zone Matrix Table */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <h2 className="text-xl font-semibold text-white tracking-tight mb-1">Zone Risk Matrix</h2>
          <p className="text-sm text-white/50 mb-6">Cross-sectional hazard assessment</p>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {zoneChartData.sort((a:any,b:any) => a.score - b.score).map((z: any) => (
                <div key={z.zone} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{z.zone}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-white/40">
                        <Droplets className="w-3 h-3" style={{color: RISK_COLORS[z.water_risk]}}/> H₂O
                      </span>
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-white/40">
                        <Recycle className="w-3 h-3" style={{color: RISK_COLORS[z.waste_risk]}}/> WST
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400">{z.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
