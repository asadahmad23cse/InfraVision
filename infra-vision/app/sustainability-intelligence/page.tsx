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
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { Droplets, Zap, Recycle, TreePine, Flame, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { getOverview, getFullData, type OverviewResponse, type SustainabilityRow } from '@/lib/sustainabilityApi';

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  moderate: '#eab308',
  safe: '#22c55e',
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
            .map(([y, v]) => ({
              year: Number(y),
              water_gap: Math.max(0, (v as any).water_gap),
              renewable: (v as any).energy > 0 ? ((v as any).renewable_sum / (v as any).energy) : 0,
              waste_rate: (v as any).waste_gen > 0 ? ((v as any).waste_proc / (v as any).waste_gen) * 100 : 0,
              ghg: (v as any).ghg,
              score: (v as any).count ? (v as any).score / (v as any).count : 0,
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading sustainability data...</div>
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sustainability Overview</h1>
          <p className="text-gray-400 text-sm">Delhi City — Command Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
          >
            {Array.from({ length: 16 }, (_, i) => 2015 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Droplets className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-xs text-gray-400">Water Gap</p>
            <p className={`text-xl font-bold ${overview.water_gap_mgd > 100 ? 'text-red-400' : 'text-white'}`}>
              {overview.water_gap_mgd} MGD
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Zap className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-xs text-gray-400">Renewable %</p>
            <p className="text-xl font-bold text-white">{overview.renewable_share_percent}%</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Recycle className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xs text-gray-400">Waste Processed</p>
            <p className="text-xl font-bold text-white">{overview.waste_processing_rate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <TreePine className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-xs text-gray-400">Green sqm/capita</p>
            <p className="text-xl font-bold text-white">{overview.green_space_sqm_per_capita}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Flame className="w-5 h-5 text-orange-400 mb-2" />
            <p className="text-xs text-gray-400">GHG (MT CO₂)</p>
            <p className="text-xl font-bold text-white">{overview.ghg_emissions_mtco2}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Target className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xs text-gray-400">City Score</p>
            <p className="text-xl font-bold text-emerald-400">{overview.city_sustainability_score}</p>
          </CardContent>
        </Card>
      </div>

      {/* Zone comparison + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Zone Comparison ({year})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="zone" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="score" name="Sustainability Score" radius={4}>
                  {zoneChartData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.water_risk] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Critical</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> Moderate</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Safe</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Trend (2015–2030)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <ReferenceLine x={2022} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} name="Score" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="waste_rate" stroke="#06b6d4" strokeWidth={1} name="Waste %" dot={{ r: 2 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk flags */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Zone Risk Flags ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {zoneChartData.map((z) => (
              <div
                key={z.zone}
                className={`p-3 rounded-lg border ${
                  z.water_risk === 'critical' ? 'bg-red-500/10 border-red-500/50' :
                  z.water_risk === 'high' ? 'bg-amber-500/10 border-amber-500/50' :
                  z.waste_risk === 'critical' ? 'bg-orange-500/10 border-orange-500/50' :
                  'bg-slate-700/50 border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{z.zone}</span>
                  {z.water_risk === 'safe' && z.waste_risk === 'safe' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Water: {z.water_risk} | Waste: {z.waste_risk}
                </p>
                <p className="text-sm text-emerald-400 mt-1">Score: {z.score}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
