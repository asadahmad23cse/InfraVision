'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const ZONES = ["North","South","East","West","Central","North-East","North-West","South-West","South-East"];
const MODELS = ['score','energy','waste','carbon'];
const API    = process.env.NEXT_PUBLIC_SUSTAINABILITY_API || '';

const MODEL_META: Record<string, {label: string; icon: string; color: string}> = {
  score:  { label: 'Sustainability Score', icon: '🎯', color: '#22c55e' },
  energy: { label: 'Energy Consumption',  icon: '⚡', color: '#f59e0b' },
  waste:  { label: 'Waste Generation',    icon: '♻', color: '#8b5cf6' },
  carbon: { label: 'Carbon Emissions',    icon: '💨', color: '#ef4444' },
};

export default function ExplainabilityPage() {
  const [zone,  setZone]   = useState('North');
  const [model, setModel]  = useState('score');
  const [year,  setYear]   = useState(2022);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/ml/explain?zone=${encodeURIComponent(zone)}&year=${year}`);
      if (r.ok) setResult(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const waterfall = result?.waterfall || [];
  const top5 = waterfall.slice(0, 10);

  const positiveSum = waterfall.filter((f:any) => f.shap_value > 0).reduce((s:number, f:any) => s + f.shap_value, 0);
  const negativeSum = waterfall.filter((f:any) => f.shap_value < 0).reduce((s:number, f:any) => s + Math.abs(f.shap_value), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🔍 Explainable AI</h1>
        <p className="text-gray-400 text-sm mt-1">SHAP values show why the ML model made each prediction — which features drove the score up or down</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-fit">
          <h2 className="text-white font-semibold mb-4">Explain a Prediction</h2>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Zone</label>
              <select value={zone} onChange={e => setZone(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-1">Year</label>
              <select value={year} onChange={e => setYear(+e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
                {Array.from({length:8}, (_,i) => 2015+i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <button onClick={explain} disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all">
              {loading ? '⏳ Computing SHAP…' : '🔍 Explain Prediction'}
            </button>
          </div>

          {/* Model info */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-gray-500 text-xs mb-2">How it works</p>
            <div className="space-y-2 text-xs text-gray-400">
              <p>• SHAP (SHapley Additive exPlanations) decomposes each prediction into feature contributions</p>
              <p>• Green bars ↑ push the score higher</p>
              <p>• Red bars ↓ pull the score lower</p>
              <p>• Base value = average prediction across all zones/years</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {!result ? (
            <div className="flex items-center justify-center h-64 bg-slate-800 border border-slate-700 rounded-2xl">
              <div className="text-center text-gray-500">
                <p className="text-4xl mb-3">🔍</p>
                <p>Select a zone and click Explain</p>
              </div>
            </div>
          ) : (
            <>
              {/* Prediction summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs">Base Value (avg)</p>
                  <p className="text-white font-bold text-2xl">{result.base_value}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs">ML Prediction</p>
                  <p className="text-emerald-400 font-bold text-2xl">{result.prediction}</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs">Zone / Year</p>
                  <p className="text-white font-bold text-lg">{result.zone || zone}</p>
                  <p className="text-gray-400 text-xs">{year}</p>
                </div>
              </div>

              {/* SHAP waterfall chart */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-1">SHAP Waterfall Chart</h3>
                <p className="text-gray-500 text-xs mb-4">Feature contributions to prediction (top 10)</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={top5} layout="vertical" margin={{left: 20, right: 30}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
                    <XAxis type="number" tick={{fill:'#94a3b8', fontSize:10}}
                      label={{value:'SHAP Value', position:'insideBottom', offset:-5, fill:'#94a3b8', fontSize:11}}/>
                    <YAxis type="category" dataKey="feature" tick={{fill:'#94a3b8', fontSize:10}} width={160}/>
                    <ReferenceLine x={0} stroke="#64748b" strokeWidth={2}/>
                    <Tooltip formatter={(v: any) => [v.toFixed(4), 'SHAP']}
                      contentStyle={{backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'8px'}}/>
                    <Bar dataKey="shap_value" radius={3}>
                      {top5.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.direction === 'positive' ? '#22c55e' : '#ef4444'}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex gap-6 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded"/>Increases score</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"/>Decreases score</span>
                  <span className="ml-auto">Sum positive: +{positiveSum.toFixed(3)} | Sum negative: -{negativeSum.toFixed(3)}</span>
                </div>
              </div>

              {/* Top drivers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                  <h3 className="text-emerald-400 font-semibold mb-3">↑ Top Positive Drivers</h3>
                  <div className="space-y-2">
                    {(result.top_positive_drivers || []).map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">{d.feature.replace(/_/g,' ')}</span>
                        <span className="text-emerald-400 text-sm font-mono">+{d.shap.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                  <h3 className="text-red-400 font-semibold mb-3">↓ Top Negative Drivers</h3>
                  <div className="space-y-2">
                    {(result.top_negative_drivers || []).map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">{d.feature.replace(/_/g,' ')}</span>
                        <span className="text-red-400 text-sm font-mono">{d.shap.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature values table */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4">Raw Feature Values</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(result.feature_values || {}).map(([k, v]: any) => (
                    <div key={k} className="bg-slate-700/50 rounded-lg px-3 py-2">
                      <p className="text-gray-500 text-xs">{k.replace(/_/g,' ')}</p>
                      <p className="text-white text-sm font-mono">{typeof v === 'number' ? v.toFixed(3) : v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
