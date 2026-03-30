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
import { TreePine, Thermometer } from 'lucide-react';
import { getFullData, getZones } from '@/lib/sustainabilityApi';

const WHO_TARGET = 9; // sqm per person

export default function GreenSpacePage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
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

  const greenData = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, green_sqkm: 0, tree_pct: 0, built: 0, pop: 0, score: 0, heat_risk: 'low', sqm_capita: 0 };
    const pop = latest.population || 1;
    const green = latest.green_space_sqkm || 0;
    const sqmCapita = (green * 1e6) / pop;
    const score = green * 0.5 + (latest.tree_cover_percent || 0) * 0.3;
    const heatRisk = (latest.built_up_density_percent || 0) > 80 && score < 15 ? 'critical' :
      (latest.built_up_density_percent || 0) > 70 && score < 20 ? 'high' :
      (latest.built_up_density_percent || 0) > 60 ? 'medium' : 'low';
    return {
      zone: z,
      green_sqkm: green,
      tree_pct: latest.tree_cover_percent || 0,
      built: latest.built_up_density_percent || 0,
      pop,
      score: Math.min(100, score * 2),
      heat_risk: heatRisk,
      sqm_capita: sqmCapita,
      gap_to_who: Math.max(0, WHO_TARGET - sqmCapita),
    };
  });

  const heatRiskColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#eab308',
    low: '#22c55e',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading green space data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Green Space & Heat Island Risk</h1>
      <p className="text-gray-400 text-sm mb-6">Delhi green cover &lt; 20% in most zones. Urban Heat Islands increase energy demand + health risk.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Green Space Score per Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={greenData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="zone" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="score" name="Green Score" radius={4}>
                  {greenData.map((entry, i) => (
                    <Cell key={i} fill={heatRiskColors[entry.heat_risk] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Heat Island Risk per Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {greenData.map((z) => (
                <button
                  key={z.zone}
                  onClick={() => setSelectedZone(selectedZone === z.zone ? null : z.zone)}
                  className={`p-4 rounded-xl border text-left ${
                    selectedZone === z.zone ? 'ring-2 ring-emerald-400' : ''
                  }`}
                  style={{ backgroundColor: `${heatRiskColors[z.heat_risk]}20`, borderColor: `${heatRiskColors[z.heat_risk]}60` }}
                >
                  <span className="font-semibold text-white block">{z.zone}</span>
                  <span className="text-sm capitalize" style={{ color: heatRiskColors[z.heat_risk] }}>{z.heat_risk}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Green Deficit (Current vs WHO Target: 9 sqm/person)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {greenData.map((z) => (
              <div key={z.zone} className="flex items-center gap-3">
                <span className="w-24 text-white text-sm">{z.zone}</span>
                <div className="flex-1 flex gap-1">
                  <div
                    className="h-6 bg-emerald-500 rounded-l"
                    style={{ width: `${Math.min(100, (z.sqm_capita / WHO_TARGET) * 100)}%` }}
                  />
                  <div
                    className="h-6 bg-red-500/50 rounded-r"
                    style={{ width: `${Math.min(100, ((z.gap_to_who ?? 0) / WHO_TARGET) * 100)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-20">{z.sqm_capita.toFixed(1)} / 9 sqm</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedZone && (
        <Card className="bg-slate-800 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">New Park Recommender — {selectedZone}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const z = greenData.find((x) => x.zone === selectedZone);
              if (!z) return null;
              const areaNeeded = ((z.gap_to_who ?? 0) * z.pop) / 1e6;
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-gray-400 text-sm">Recommended area</p>
                    <p className="text-xl font-bold text-emerald-400">{areaNeeded.toFixed(2)} sq km</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-gray-400 text-sm">Priority score</p>
                    <p className="text-xl font-bold text-white">{(100 - z.score).toFixed(0)}</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-gray-400 text-sm">Expected heat reduction</p>
                    <p className="text-xl font-bold text-cyan-400">~{z.heat_risk === 'critical' ? 2 : z.heat_risk === 'high' ? 1.5 : 1}°C</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-gray-400 text-sm">Health benefit score</p>
                    <p className="text-xl font-bold text-white">{Math.min(100, (z.gap_to_who ?? 0) * 5)}</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
