'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { Lightbulb, AlertCircle, ChevronRight } from 'lucide-react';
import { getZoneRecommendations, getZones, type ZoneRecommendations } from '@/lib/sustainabilityApi';

export default function RecommendationsPage() {
  const [zones, setZones] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ZoneRecommendations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getZones().then((r) => setZones(r.zones || []));
  }, []);

  useEffect(() => {
    if (!selectedZone) {
      setRecommendations(null);
      return;
    }
    setLoading(true);
    getZoneRecommendations(selectedZone)
      .then(setRecommendations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedZone]);

  const urgencyColors: Record<string, string> = {
    Critical: 'bg-red-500/20 border-red-500/50 text-red-400',
    High: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    Medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    Low: 'bg-slate-700/50 border-slate-600 text-gray-400',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">AI Recommendation Engine</h1>
      <p className="text-gray-400 text-sm mb-6">Zone-specific action plans with ranked interventions.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Select Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {zones.map((z) => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedZone === z
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-slate-500'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Zone Health Report Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : recommendations ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${urgencyColors[recommendations.urgency] || 'bg-slate-700'}`}>
                    <p className="text-sm text-gray-400">Biggest Risk</p>
                    <p className="text-xl font-bold">{recommendations.biggest_risk}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${urgencyColors[recommendations.urgency] || 'bg-slate-700'}`}>
                    <p className="text-sm text-gray-400">Urgency</p>
                    <p className="text-xl font-bold">{recommendations.urgency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-3">Top 3 Interventions</p>
                  <div className="space-y-3">
                    {recommendations.top_interventions.map((int, i) => (
                      <div key={i} className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-white">{int.action}</p>
                            <p className="text-sm text-gray-400 mt-1">{int.impact}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Cost: ₹{int.cost_cr} Cr | Timeline: {int.timeline_years} years
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-gray-400 text-sm">Current Score</p>
                    <p className="text-2xl font-bold text-white">{recommendations.current_score}</p>
                  </div>
                  <ChevronRight className="w-8 h-8 text-gray-500 self-center" />
                  <div>
                    <p className="text-gray-400 text-sm">Projected Score (if actions taken)</p>
                    <p className="text-2xl font-bold text-emerald-400">{recommendations.projected_score_if_actions_taken}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select a zone to view recommendations</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
