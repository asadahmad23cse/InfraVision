'use client';

import { useState, useEffect } from 'react';
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { Recycle, AlertTriangle } from 'lucide-react';
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

  const topInterventionZones = zoneWasteData.filter((z) => z.landfill > 500).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading waste data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Waste & Circular Economy Analyzer</h1>
      <p className="text-gray-400 text-sm mb-6">11,000 TPD waste, 49% to landfill. Show which zones drive the landfill crisis.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Zone Waste: Generated vs Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneWasteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="zone" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="generated" name="Generated (TPD)" fill="#ef4444" radius={4} />
                <Bar dataKey="processed" name="Processed (TPD)" fill="#22c55e" radius={4} />
                <Bar dataKey="landfill" name="To Landfill (TPD)" fill="#78716c" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Circular Economy Index (Target: 80%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zoneWasteData.map((z) => (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="w-24 text-white text-sm">{z.zone}</span>
                  <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${z.ce_index >= 80 ? 'bg-emerald-500' : z.ce_index >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, z.ce_index)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12">{z.ce_index.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intervention Map */}
      <Card className="bg-slate-800 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Top 3 Zones for Immediate Waste Intervention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topInterventionZones.map((z, i) => (
                <div key={z.zone} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <span className="text-red-400 font-bold">#{i + 1} {z.zone}</span>
                  <p className="text-white mt-2">Landfill: {z.landfill.toFixed(0)} TPD</p>
                  <p className="text-gray-400 text-sm">CE Index: {z.ce_index.toFixed(0)}% — gap to 80%: {(80 - z.ce_index).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Recycling Impact Forecaster */}
      <Card className="bg-slate-800 border-slate-700 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Recycling Impact Forecaster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-gray-400">Zone</label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="block mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                {zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Recycling increase (%)</label>
              <select
                value={recyclingTarget}
                onChange={(e) => setRecyclingTarget(Number(e.target.value))}
                className="block mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                {[10, 20, 30, 40, 50].map((v) => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>
          </div>
          {forecastResult && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Landfill reduction</p>
                <p className="text-xl font-bold text-emerald-400">{forecastResult.landfill_reduction_tpd} TPD</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">GHG savings</p>
                <p className="text-xl font-bold text-white">{forecastResult.ghg_savings_mtco2} MT CO₂</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Projected CE Index</p>
                <p className="text-xl font-bold text-white">{forecastResult.projected_ce_index}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Years to achieve</p>
                <p className="text-xl font-bold text-white">{forecastResult.years_to_achieve}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
