'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ai-features/components/ui/card';
import { Button } from '@/components/ai-features/components/ui/button';
import { FileText, Download, FileJson } from 'lucide-react';
import { getOverview, getFullData } from '@/lib/sustainabilityApi';

export default function ReportsPage() {
  const [year, setYear] = useState(2022);
  const [overview, setOverview] = useState<any>(null);
  const [fullData, setFullData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getOverview(year), getFullData(undefined, year)]).then(([ov, full]) => {
      setOverview(ov);
      setFullData(full.data || []);
    });
  }, [year]);

  const handleExportCSV = () => {
    const headers = overview?.zone_data?.[0] ? Object.keys(overview.zone_data[0]) : [];
    const rows = fullData;
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sustainability_delhi_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ year, overview, zone_data: fullData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sustainability_delhi_${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Planner Report Generator</h1>
      <p className="text-gray-400 text-sm mb-6">Export reports for decision makers.</p>

      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <label className="text-gray-400">Year:</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              {Array.from({ length: 16 }, (_, i) => 2015 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {overview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs">Water Gap</p>
                  <p className="text-lg font-bold text-white">{overview.water_gap_mgd} MGD</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs">Renewable %</p>
                  <p className="text-lg font-bold text-white">{overview.renewable_share_percent}%</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs">Waste Processed</p>
                  <p className="text-lg font-bold text-white">{overview.waste_processing_rate}%</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs">City Score</p>
                  <p className="text-lg font-bold text-emerald-400">{overview.city_sustainability_score}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleExportCSV}
              className="bg-emerald-500 hover:bg-emerald-400 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
            <Button
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
              onClick={() => alert('PDF export requires a server-side PDF library. Use CSV/JSON for now.')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF (Coming soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
