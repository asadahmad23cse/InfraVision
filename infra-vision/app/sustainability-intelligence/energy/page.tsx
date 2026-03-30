'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { Zap, Sun, TrendingUp } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading energy data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Energy Transition & Solar Planning</h1>
      <p className="text-gray-400 text-sm mb-6">Delhi uses ~36,000 MU/year. Solar share &lt; 3%. Show where solar deployment gives maximum impact.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Zone-wise Energy Consumption & Renewable Share</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={consumptionByZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="zone" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="energy" name="Energy (MU)" fill="#f59e0b" radius={4} />
                <Bar yAxisId="right" dataKey="renewable" name="Renewable %" fill="#22c55e" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Renewable Scenario Simulator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Zone</label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                {zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Target Renewable %</label>
              <select
                value={renewableTarget}
                onChange={(e) => setRenewableTarget(Number(e.target.value))}
                className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
              </select>
            </div>
            {forecastResult && (
              <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
                <p className="text-emerald-400 font-semibold">Solar MW needed: {forecastResult.solar_mw_needed}</p>
                <p className="text-white">GHG reduction: {forecastResult.ghg_reduction_mtco2} MT CO₂</p>
                <p className="text-white">Cost: ₹{forecastResult.cost_estimate_cr} Cr</p>
                <p className="text-gray-400">Years to achieve: {forecastResult.years_to_achieve}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Solar Deployment Priority Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {solarPriorityData.map((z, i) => (
              <div key={z.zone} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="text-emerald-400 font-bold">#{i + 1}</span>
                <p className="font-medium text-white">{z.zone}</p>
                <p className="text-xs text-gray-400">Solar score: {z.solar_score.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
