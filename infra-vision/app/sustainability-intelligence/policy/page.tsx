'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { Sliders, Sparkles, Loader2 } from 'lucide-react';
import { simulatePolicy, type PolicyParams, type PolicyResult } from '@/lib/sustainabilityApi';

const SLIDERS: { key: keyof PolicyParams; label: string; max: number }[] = [
  { key: 'solar_increase', label: 'Solar adoption increase', max: 100 },
  { key: 'waste_improvement', label: 'Waste processing improvement', max: 50 },
  { key: 'green_expansion', label: 'Green space expansion', max: 30 },
  { key: 'water_conservation', label: 'Water conservation programs', max: 40 },
  { key: 'ev_adoption', label: 'EV adoption rate', max: 60 },
  { key: 'public_transport', label: 'Public transport shift', max: 50 },
];

export default function PolicySimulatorPage() {
  const [params, setParams] = useState<PolicyParams>({
    solar_increase: 0,
    waste_improvement: 0,
    green_expansion: 0,
    water_conservation: 0,
    ev_adoption: 0,
    public_transport: 0,
  });
  const [result, setResult] = useState<PolicyResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const r = await simulatePolicy(params);
        setResult(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [params]);

  const radarData = result ? [
    { metric: 'GHG Reduction', value: Math.min(100, (result.ghg_reduction_mtco2 / 10) * 10), fullMark: 100 },
    { metric: 'Water Savings', value: Math.min(100, result.water_savings_mgd * 2), fullMark: 100 },
    { metric: 'Waste Diverted', value: Math.min(100, result.waste_diverted_tpd / 5), fullMark: 100 },
    { metric: 'Score Delta', value: Math.min(100, result.sustainability_score_delta * 4), fullMark: 100 },
    { metric: 'ROI', value: Math.min(100, result.roi_score * 5), fullMark: 100 },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Policy Simulator</h1>
      <p className="text-gray-400 text-sm mb-6">Interactive what-if engine — test policies before spending money.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Policy Sliders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {SLIDERS.map(({ key, label, max }) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">{label}</span>
                  <span className="text-emerald-400">{params[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={max}
                  value={params[key]}
                  onChange={(e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating...
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <p className="text-gray-400 text-xs">GHG Reduction</p>
                  <p className="text-xl font-bold text-emerald-400">{result.ghg_reduction_mtco2} MT CO₂</p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <p className="text-gray-400 text-xs">Water Savings</p>
                  <p className="text-xl font-bold text-cyan-400">{result.water_savings_mgd} MGD</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <p className="text-gray-400 text-xs">Waste Diverted</p>
                  <p className="text-xl font-bold text-purple-400">{result.waste_diverted_tpd} TPD</p>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <p className="text-gray-400 text-xs">Score Delta</p>
                  <p className="text-xl font-bold text-amber-400">+{result.sustainability_score_delta} pts</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs">Cost Estimate</p>
                  <p className="text-xl font-bold text-white">₹{result.cost_estimate_cr} Cr</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <p className="text-gray-400 text-xs">ROI Score</p>
                  <p className="text-xl font-bold text-emerald-400">{result.roi_score}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {result && radarData.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Impact Spider Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                <Radar name="Impact" dataKey="value" stroke="#22c55e" fill="#22c55e40" strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
