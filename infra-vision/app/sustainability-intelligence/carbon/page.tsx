'use client';

import { useState, useEffect } from 'react';
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
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { Flame, Target, TrendingDown } from 'lucide-react';
import { getFullData, getZones } from '@/lib/sustainabilityApi';

const BASELINE_YEAR = 2015;
const NET_ZERO_YEAR = 2070;

export default function CarbonPage() {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [zones, setZones] = useState<string[]>([]);
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

  const emissionsByZone = zones.map((z) => {
    const d = zoneData.filter((r: any) => r.zone === z);
    const latest = d.find((r: any) => r.year === Math.max(...d.map((x: any) => x.year)));
    if (!latest) return { zone: z, energy: 0, transport: 0, waste: 0, total: 0 };
    const energy = (latest.ghg_emissions_mtco2 || 0) * 0.6;
    const transport = latest.transport_emissions_mtco2 || 0;
    const waste = latest.waste_emissions_mtco2 || 0;
    return { zone: z, energy, transport, waste, total: energy + transport + waste };
  });

  const yearlyTotal = Object.entries(
    zoneData.reduce((acc: Record<number, number>, r: any) => {
      acc[r.year] = (acc[r.year] || 0) + (r.ghg_emissions_mtco2 || 0) + (r.transport_emissions_mtco2 || 0) + (r.waste_emissions_mtco2 || 0);
      return acc;
    }, {})
  ).map(([year, total]) => ({ year: Number(year), total })).sort((a, b) => a.year - b.year);

  const baselineEmissions = yearlyTotal.find((d) => d.year === BASELINE_YEAR)?.total || 55;
  const reductionNeededPerYear = baselineEmissions / (NET_ZERO_YEAR - BASELINE_YEAR);

  const scenarioData = yearlyTotal.map((d) => ({
    ...d,
    baseline: d.total,
    moderate: d.total * Math.pow(0.97, d.year - 2022),
    aggressive: d.total * Math.pow(0.95, d.year - 2022),
  })).filter((d) => d.year <= 2030);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading carbon data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Carbon Footprint Analyzer</h1>
      <p className="text-gray-400 text-sm mb-6">Delhi must align with India's 2070 net-zero goal. Track zone-wise emissions, run reduction scenarios.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Emissions Breakdown by Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emissionsByZone} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="zone" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} width={55} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="energy" stackId="a" name="Energy" fill="#f59e0b" />
                <Bar dataKey="transport" stackId="a" name="Transport" fill="#06b6d4" />
                <Bar dataKey="waste" stackId="a" name="Waste" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Net-Zero Progress Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Baseline (2015): {baselineEmissions.toFixed(1)} MT CO₂e</p>
                <p className="text-gray-400 text-sm">Reduction needed per year to 2070: {reductionNeededPerYear.toFixed(2)} MT CO₂e</p>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, ((baselineEmissions - (yearlyTotal[yearlyTotal.length - 1]?.total || baselineEmissions)) / baselineEmissions) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">Progress toward trajectory</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Policy Scenario Projections (2015–2030)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <ReferenceLine x={2022} stroke="#f59e0b" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="baseline" name="Baseline" stroke="#94a3b8" fill="#94a3b840" />
              <Area type="monotone" dataKey="moderate" name="Moderate (3%/yr)" stroke="#22c55e" fill="#22c55e40" />
              <Area type="monotone" dataKey="aggressive" name="Aggressive (5%/yr)" stroke="#06b6d4" fill="#06b6d440" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
