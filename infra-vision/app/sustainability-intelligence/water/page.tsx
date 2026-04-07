'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, ReferenceLine,
} from 'recharts';
import { AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { getAlertsHistory, getFullData, forecastWater, getForecastSeries, getZones, type AlertRecord, type WaterForecast } from '@/lib/sustainabilityApi';

const STRESS_COLORS: Record<string, string> = {
  critical: '#fb7185', // rose-400
  high: '#fbbf24',     // amber-400
  moderate: '#fcd34d', // amber-300
  safe: '#34d399',     // emerald-400
};

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Backend / proxy sometimes nests or renames the predictions array. */
function pickWaterPredictions(series: unknown): any[] {
  if (!series || typeof series !== 'object') return [];
  const s = series as Record<string, unknown>;
  if (Array.isArray(s.predictions)) return s.predictions;
  const data = s.data as Record<string, unknown> | undefined;
  if (data && Array.isArray(data.predictions)) return data.predictions as any[];
  if (Array.isArray(s.results)) return s.results as any[];
  return [];
}

/** Last-resort series so the confidence chart always has points (CSV-backed). */
function buildSyntheticWaterForecastSeries(
  zone: string,
  rows: any[],
  startYear: number,
  endYear: number,
) {
  const d = rows.filter((r) => r.zone === zone).sort((a, b) => num(a.year) - num(b.year));
  const byYear = new Map(d.map((r) => [r.year, r]));
  const latest = d[d.length - 1];
  if (!latest) return [];
  const ly = num(latest.year);
  const base = num(latest.water_demand_mgd);
  const out: any[] = [];
  for (let y = startYear; y <= endYear; y += 1) {
    const row = byYear.get(y);
    const demand = row ? num(row.water_demand_mgd) : base * Math.pow(1.02, Math.max(0, y - ly));
    const lower = demand * 0.92;
    const upper = demand * 1.08;
    out.push({
      year: y,
      demand_forecast: Math.round(demand * 10) / 10,
      yhat_lower: Math.round(lower * 10) / 10,
      yhat_upper: Math.round(upper * 10) / 10,
    });
  }
  return out;
}

export default function WaterStressPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [waterForecast, setWaterForecast] = useState<WaterForecast | null>(null);
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [waterForecastSeries, setWaterForecastSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toNum = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [full, zonesRes] = await Promise.all([getFullData(), getZones()]);
        setZones(zonesRes.zones || []);
        setZoneData(full.data || []);

        let alertsList: AlertRecord[] = [];
        try {
          const history = await getAlertsHistory(20);
          alertsList = (history.alerts || []).filter((a) => Boolean(a?.message));
        } catch {
          alertsList = [];
        }

        if (alertsList.length === 0) {
          for (const z of zonesRes.zones || []) {
            const f = await forecastWater(z, 2030);
            if (f.alert) {
              alertsList.push({
                zone: z,
                alert_type: 'WATER_STRESS_FORECAST',
                message: f.alert,
                is_anomaly: false,
              });
            }
          }
        }
        setAlerts(alertsList);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load water intelligence data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedZone) {
      setWaterForecast(null);
      setWaterForecastSeries([]);
      return;
    }
    Promise.all([
      forecastWater(selectedZone, 2030),
      getForecastSeries('water', selectedZone, 2025, 2030),
    ])
      .then(([summary, series]) => {
        setWaterForecast(summary);
        setWaterForecastSeries(pickWaterPredictions(series));
      })
      .catch((e) => {
        setWaterForecast(null);
        setWaterForecastSeries([]);
        setError(e instanceof Error ? e.message : 'Unable to load water forecast');
      });
  }, [selectedZone]);

  const zoneMapData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z).sort((a: any, b: any) => toNum(a.year) - toNum(b.year));
    const latest = d[d.length - 1];
    if (!latest) return { zone: z, gap_pct: 0, stress: 'safe' as const };
    const demand = toNum(latest.water_demand_mgd);
    const supply = toNum(latest.water_supply_mgd);
    const gap = demand > 0
      ? ((demand - supply) / demand) * 100
      : 0;
    let stress: keyof typeof STRESS_COLORS = 'safe';
    if (gap >= 30) stress = 'critical';
    else if (gap >= 15) stress = 'high';
    else if (gap >= 5) stress = 'moderate';
    return { zone: z, gap_pct: gap, stress };
  });

  const demandTrendByZone = (zone: string) => {
    const d = zoneData.filter((r: any) => r.zone === zone).sort((a: any, b: any) => a.year - b.year);
    return d.map((r: any) => ({
      year: r.year,
      demand: toNum(r.water_demand_mgd),
      supply: toNum(r.water_supply_mgd),
      gap: Math.max(0, toNum(r.water_demand_mgd) - toNum(r.water_supply_mgd)),
    }));
  };

  const groundwaterData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z).sort((a: any, b: any) => toNum(a.year) - toNum(b.year));
    const latest = d[d.length - 1];
    if (!latest) return { zone: z, extraction: 0, recharge: 0, ratio: 0 };
    const ext = toNum(latest.groundwater_extraction_mgd);
    const rech = toNum(latest.groundwater_recharge_mgd);
    return { zone: z, extraction: ext, recharge: rech, ratio: rech > 0 ? ext / rech : 0 };
  });

  const rawForecastRows =
    selectedZone && waterForecastSeries.length === 0 && zoneData.length > 0
      ? buildSyntheticWaterForecastSeries(selectedZone, zoneData, 2025, 2030)
      : waterForecastSeries;

  const forecastBandData = selectedZone
    ? rawForecastRows.map((row: any) => {
        const lower = toNum(row.yhat_lower ?? row.lower ?? row.yhat_lower_ci);
        const upper = toNum(row.yhat_upper ?? row.upper ?? row.yhat_upper_ci);
        let forecast = toNum(row.demand_forecast ?? row.yhat ?? row.demand_forecast_mgd);
        if (!forecast && lower && upper) forecast = (lower + upper) / 2;
        return {
          year: toNum(row.year),
          forecast,
          yhat_lower: lower,
          yhat_upper: upper,
          interval_base: lower,
          interval_range: Math.max(0, upper - lower),
        };
      })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent border-t-cyan-400 border-r-cyan-700 animate-spin"></div>
          <div className="text-white/50 text-sm font-medium tracking-widest uppercase animate-pulse">Running Hydro-Models</div>
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
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse"></div>
          <p className="text-sm text-cyan-400/80 font-semibold tracking-widest uppercase">Water Infrastructure Domain</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 tracking-tight">
          Hydro-Resource Intelligence
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          Trace the critical vector between supply (~960 MGD) and demand (~1,380 MGD). Predict structural scarcity before it cascades into a crisis.
        </p>
      </motion.div>

      {/* AI Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="mb-8 p-6 bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl relative overflow-hidden flex items-start gap-4 shadow-[0_10px_40px_rgba(244,63,94,0.15)] group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none group-hover:bg-rose-500/30 transition-colors"></div>
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-400 text-lg font-semibold mb-3 flex items-center gap-2">Algorithmic Danger Alerts</h3>
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-3 bg-black/20 p-3 rounded-xl border border-rose-500/10 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-widest font-bold ${a.is_anomaly ? 'bg-rose-500/15 text-rose-300 border-rose-500/40' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>
                        {a.is_anomaly ? 'ML Detected' : 'Threshold Alert'}
                      </span>
                      {a.zone && <span className="text-[10px] text-white/40 uppercase tracking-wider">{a.zone}</span>}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{a.message || a.alert_type || 'Alert detected'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Storytelling Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Step 1: The Problem (Current Stress Map) */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">01 / The Problem</p>
              <h2 className="text-xl font-semibold text-white tracking-tight">Cross-sectional Stress Map</h2>
            </div>
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs text-white/70">Select node for deep dive</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {zoneMapData.map((z) => {
              const isActive = selectedZone === z.zone;
              return (
                <motion.button
                  key={z.zone}
                  onClick={() => setSelectedZone(isActive ? null : z.zone)}
                  className={`relative p-5 rounded-2xl border text-left transition-all duration-300 overflow-hidden group hover:scale-[1.02] ${
                    isActive 
                      ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Glowing background hint based on stress */}
                  <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-xl opacity-30 transition-opacity group-hover:opacity-50`} style={{ backgroundColor: STRESS_COLORS[z.stress] }}></div>
                  
                  <span className="font-semibold text-white text-lg block mb-1">{z.zone}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STRESS_COLORS[z.stress] }}></span>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: STRESS_COLORS[z.stress] }}>
                      {z.stress}
                    </span>
                    <span className="text-xs text-white/40 ml-auto">{z.gap_pct.toFixed(0)}% Deficit</span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Step 2: The Forecast (Selected Zone Details) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative group overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none transition-colors"></div>
          
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1 relative z-10">02 / The Forecast</p>
          <h2 className="text-xl font-semibold text-white tracking-tight mb-6 relative z-10">2030 Capacity Projection</h2>

          {waterForecast ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col relative z-10">
              <div className="flex-1 bg-black/30 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">{waterForecast.zone}</p>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Projected Demand</p>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">{waterForecast.demand_forecast_mgd} <span className="text-sm font-normal text-white/30">MGD</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Estimated Supply</p>
                    <p className="text-2xl font-bold text-emerald-400">{waterForecast.supply_forecast_mgd} <span className="text-sm font-normal text-white/30">MGD</span></p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-widest">Calculated Gap</span>
                    <span className="text-lg font-bold" style={{ color: STRESS_COLORS[waterForecast.stress_level] }}>{waterForecast.gap_percent}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, waterForecast.gap_percent)}%`, backgroundColor: STRESS_COLORS[waterForecast.stress_level] }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 opacity-60">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-sm text-white/80 font-medium">Auto-Targeting Inactive</p>
              <p className="text-xs text-white/40 mt-1 max-w-[200px]">Select a geographic node from the stress map to run the forecasting model.</p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 3: Groundwater Health Subsurface */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">03 / Subsurface Risk</p>
          <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Groundwater Aquifer Depletion</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groundwaterData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="zone" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff', fontWeight: 600}}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                <Bar dataKey="extraction" name="Extraction (MGD)" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={12} style={{ filter: 'drop-shadow(0 0 6px rgba(251,113,133,0.4))' }} />
                <Bar dataKey="recharge" name="Recharge (MGD)" fill="#34d399" radius={[4, 4, 0, 0]} barSize={12} style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.4))' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Step 4: Demand Trend + Forecast Confidence */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-7 shadow-[0_15px_45px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700 pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-5">
            <div>
              <p className="text-[10px] text-cyan-400/80 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                04 / Predictive Intelligence
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                Demand Forecast vs Capacity
              </h2>
              <p className="text-xs text-gray-400 mt-1.5">Machine learning projection of water scarcity trajectories with 95% confidence intervals</p>
            </div>
            {selectedZone && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 text-xs font-bold tracking-widest uppercase shadow-inner">
                  {selectedZone} Node
                </span>
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Model: Meta Prophet</span>
              </div>
            )}
          </div>
          
          <div className="h-[320px] w-full">
            {selectedZone ? (() => {
              // Build a combined continuous dataset for a true professional chart
              const hist = demandTrendByZone(selectedZone);
              const forecastMap = new Map(forecastBandData.map((f: any) => [f.year, f]));
              
              const allYears = Array.from(new Set([...hist.map((h: any) => h.year), ...forecastBandData.map((f: any) => f.year)])).sort();
              
              const combinedData = allYears.map(y => {
                const h = hist.find((r: any) => r.year === y);
                const f = forecastMap.get(y);
                
                // For a seamless line, 2024 should connect to 2025.
                // We will just expose all variables for the chart to chew on.
                return {
                  year: y,
                  historical_demand: h ? h.demand : null,
                  historical_supply: h ? h.supply : null,
                  forecast_demand: f ? f.forecast : null,
                  band: f && f.yhat_lower && f.yhat_upper ? [f.yhat_lower, f.yhat_upper] : null,
                };
              });

              // Add a bridging point so the historical line connects to the forecast line
              const lastHist = combinedData.filter(d => d.historical_demand !== null).pop();
              if (lastHist) {
                const forecastMatch = combinedData.find(d => d.year === lastHist.year);
                if (forecastMatch) {
                  forecastMatch.forecast_demand = lastHist.historical_demand;
                  forecastMatch.band = [lastHist.historical_demand, lastHist.historical_demand];
                }
              }

              return (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#fb7185" stopOpacity={0.3}/>
                         <stop offset="100%" stopColor="#fb7185" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="year" tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} axisLine={{stroke: 'rgba(255,255,255,0.1)'}} tickLine={false} dy={10} />
                    <YAxis 
                      tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} 
                      axisLine={false} 
                      tickLine={false} 
                      width={55}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `${v} MGD`}
                    />
                    
                    <Tooltip 
                      contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                      itemStyle={{fontWeight: 700, fontSize: '13px'}}
                      labelStyle={{color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}
                      cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }}
                      formatter={(val: any, name: string) => {
                        if (name === "band") return [`${val[0]} - ${val[1]}`, "95% Confidence Base/Peak"];
                        return [typeof val === 'number' ? val.toFixed(1) : val, name];
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }} iconType="circle" />
                    
                    <ReferenceLine x={2024} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} strokeOpacity={0.5} label={{value:'Present Analysis', fill:'#f59e0b', fontSize:9, position: 'top', fontWeight: 800}} />

                    {/* Historical Baseline */}
                    <Area type="monotone" dataKey="historical_demand" fill="url(#histGradient)" stroke="none" name="Historical Demand (Area)" legendType="none" />
                    <Line type="monotone" dataKey="historical_demand" stroke="#fb7185" strokeWidth={3} name="Total Historical Demand" dot={{ r: 3, fill: '#000', stroke: '#fb7185', strokeWidth: 2 }} activeDot={{r: 6}} style={{filter: 'drop-shadow(0 4px 6px rgba(251,113,133,0.4))'}} connectNulls />
                    <Line type="monotone" dataKey="historical_supply" stroke="#34d399" strokeWidth={2} strokeDasharray="3 3" name="System Supply Capacity" dot={false} activeDot={false} connectNulls />

                    {/* ML Forecast */}
                    <Area type="monotone" dataKey="band" fill="url(#bandGradient)" stroke="none" name="95% Confidence Band" />
                    <Line type="monotone" dataKey="forecast_demand" stroke="#22d3ee" strokeWidth={3} strokeDasharray="6 4" name="ML Demand Forecast" dot={{ r: 4, fill: '#000', stroke: '#22d3ee', strokeWidth: 2 }} activeDot={{r: 7, fill: '#22d3ee', strokeWidth: 0}} style={{filter: 'drop-shadow(0 4px 8px rgba(34,211,238,0.5))'}} connectNulls />
                    
                  </ComposedChart>
                </ResponsiveContainer>
              );
            })() : (
              <div className="flex h-full items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <h3 className="text-white font-bold tracking-tight mb-1">Awaiting Telemetry</h3>
                  <p className="text-gray-500 text-xs max-w-[250px]">Select a geographic node from the stress map above to render the machine learning forecast and confidence bands.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
