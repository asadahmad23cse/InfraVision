'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { AlertTriangle, Droplets, AlertCircle } from 'lucide-react';
import { getFullData, forecastWater, getZones, type WaterForecast } from '@/lib/sustainabilityApi';

const STRESS_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  moderate: '#eab308',
  safe: '#22c55e',
};

export default function WaterStressPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [waterForecast, setWaterForecast] = useState<WaterForecast | null>(null);
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [full, zonesRes] = await Promise.all([getFullData(), getZones()]);
        setZones(zonesRes.zones || []);
        setZoneData(full.data || []);
        const alertsList: string[] = [];
        for (const z of zonesRes.zones || []) {
          const f = await forecastWater(z, 2030);
          if (f.alert) alertsList.push(f.alert);
        }
        setAlerts(alertsList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedZone) {
      setWaterForecast(null);
      return;
    }
    forecastWater(selectedZone, 2030).then(setWaterForecast);
  }, [selectedZone]);

  const zoneMapData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, gap_pct: 0, stress: 'safe' as const };
    const gap = latest.water_demand_mgd > 0
      ? ((latest.water_demand_mgd - latest.water_supply_mgd) / latest.water_demand_mgd) * 100
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
      demand: r.water_demand_mgd,
      supply: r.water_supply_mgd,
      gap: Math.max(0, (r.water_demand_mgd || 0) - (r.water_supply_mgd || 0)),
    }));
  };

  const groundwaterData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, extraction: 0, recharge: 0, ratio: 0 };
    const ext = latest.groundwater_extraction_mgd || 0;
    const rech = latest.groundwater_recharge_mgd || 0;
    return { zone: z, extraction: ext, recharge: rech, ratio: rech > 0 ? ext / rech : 0 };
  });

  const wastewaterData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, capacity: 0, generated: 0, untreated: 0 };
    const gen = (latest.water_demand_mgd || 0) * 0.8;
    const cap = (latest.water_supply_mgd || 0) * 0.65;
    return { zone: z, capacity: cap, generated: gen, untreated: Math.max(0, gen - cap) };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading water stress data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Water Stress Intelligence</h1>
      <p className="text-gray-400 text-sm mb-6">Delhi supply ~960 MGD vs demand ~1,380 MGD — Identify zones hitting critical shortage by 2030</p>

      {/* AI Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 mb-6">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              AI-Generated Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-200">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Water Stress Map */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Zone-wise Water Stress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {zoneMapData.map((z) => (
                <motion.button
                  key={z.zone}
                  onClick={() => setSelectedZone(selectedZone === z.zone ? null : z.zone)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedZone === z.zone ? 'ring-2 ring-emerald-400 border-emerald-400' : ''
                  }`}
                  style={{ backgroundColor: `${STRESS_COLORS[z.stress]}20`, borderColor: `${STRESS_COLORS[z.stress]}60` }}
                >
                  <span className="font-semibold text-white block">{z.zone}</span>
                  <span className="text-sm" style={{ color: STRESS_COLORS[z.stress] }}>
                    {z.stress.toUpperCase()} ({z.gap_pct.toFixed(0)}% gap)
                  </span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demand Forecast for selected zone */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Demand Forecast 2030</CardTitle>
          </CardHeader>
          <CardContent>
            {waterForecast ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${waterForecast.stress_level === 'critical' ? 'bg-red-500/20' : waterForecast.stress_level === 'high' ? 'bg-amber-500/20' : 'bg-slate-700'}`}>
                  <p className="text-sm text-gray-400">{waterForecast.zone}</p>
                  <p className="text-2xl font-bold text-white">{waterForecast.demand_forecast_mgd} MGD demand</p>
                  <p className="text-lg text-white">{waterForecast.supply_forecast_mgd} MGD supply</p>
                  <p className="mt-2" style={{ color: STRESS_COLORS[waterForecast.stress_level] }}>
                    {waterForecast.stress_level.toUpperCase()} — {waterForecast.gap_percent}% gap
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select a zone</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Groundwater Health */}
      <Card className="bg-slate-800 border-slate-700 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Groundwater Health (Extraction vs Recharge)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={groundwaterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="zone" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="extraction" name="Extraction (MGD)" fill="#ef4444" radius={4} />
              <Bar dataKey="recharge" name="Recharge (MGD)" fill="#22c55e" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Demand trend for selected zone */}
      {selectedZone && demandTrendByZone(selectedZone).length > 0 && (
        <Card className="bg-slate-800 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Demand vs Supply Trend — {selectedZone}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={demandTrendByZone(selectedZone)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <ReferenceLine x={2022} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="demand" stroke="#ef4444" strokeWidth={2} name="Demand" />
                <Line type="monotone" dataKey="supply" stroke="#22c55e" strokeWidth={2} name="Supply" />
                <Area type="monotone" dataKey="gap" fill="#ef444420" stroke="none" name="Gap" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
