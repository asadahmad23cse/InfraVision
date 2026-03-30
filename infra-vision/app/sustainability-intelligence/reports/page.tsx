'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, FileJson, Lock, Settings } from 'lucide-react';
import { getOverview, getFullData } from '@/lib/sustainabilityApi';

export default function ReportsPage() {
  const [year, setYear] = useState(2022);
  const [overview, setOverview] = useState<any>(null);
  const [fullData, setFullData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getOverview(year), getFullData(undefined, year)])
      .then(([ov, full]) => {
        setOverview(ov);
        setFullData(full.data || []);
      })
      .finally(() => setLoading(false));
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
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8] animate-pulse"></div>
          <p className="text-sm text-indigo-400/80 font-semibold tracking-widest uppercase">System Utility</p>
        </div>
        <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 tracking-tight">
          Executive Report Serialization
        </h1>
        <p className="text-lg text-white/80 mt-1 font-light max-w-3xl">
          Format and extract raw grid data for external auditing, policymaker briefs, and external model ingestion.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Step 1: Filter Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Parametric Filters</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><Settings className="w-5 h-5 opacity-70"/> Execution Parameters</h2>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
             <div className="group/dropdown mb-6">
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3 block">Extract Temporal Node (Year)</label>
                <div className="relative">
                  <select value={year} onChange={e => setYear(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white font-medium appearance-none outline-none focus:border-indigo-500/50 transition-all cursor-pointer text-lg">
                    {Array.from({ length: 16 }, (_, i) => 2015 + i).map(y => <option key={y} value={y} className="bg-[#0B1220]">{y}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                 <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">State Verification</p>
                 <p className="text-white/70 text-sm">Target slice {year} contains full matrix values for 9 sectors.</p>
              </div>
          </div>
        </motion.div>

        {/* Step 2: Extract Summary Block */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none transition-colors"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Slice Preview</p>
              <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-400"/> Executive Summary Box</h2>
            </div>
          </div>

          <div className="flex-1 relative z-10 flex flex-col justify-center">
            {loading ? (
               <div className="flex flex-col items-center gap-3 text-white/40">
                <div className="w-8 h-8 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : overview && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl shadow-inner">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">H₂O Deficit</p>
                  <p className="text-2xl font-black text-white">{overview.water_gap_mgd} <span className="text-xs text-white/30 font-normal">MGD</span></p>
                </div>
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl shadow-inner">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Renewables</p>
                  <p className="text-2xl font-black text-white">{overview.renewable_share_percent}<span className="text-xs text-white/30 font-normal">%</span></p>
                </div>
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl shadow-inner">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Waste Managed</p>
                  <p className="text-2xl font-black text-white">{overview.waste_processing_rate}<span className="text-xs text-white/30 font-normal">%</span></p>
                </div>
                <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl shadow-inner">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Aggr. Index</p>
                  <p className="text-2xl font-black text-emerald-400">{overview.city_sustainability_score}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Step 3: Export Engine */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        
         <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Data Egress</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Format Serializers</h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
           <button onClick={handleExportCSV}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2">
            <Download className="w-5 h-5"/> Serialize CSV payload
          </button>
          
          <button onClick={handleExportJSON}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2">
            <FileJson className="w-5 h-5"/> Serialize JSON blob
          </button>

          <button onClick={() => alert('PDF export requires a server-side PDF library. Use CSV/JSON for now.')}
            className="flex-1 py-4 px-6 bg-black/40 border border-white/10 text-white/50 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-black/60 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-not-allowed">
            <Lock className="w-4 h-4"/> Enterprise PDF Vault
          </button>
        </div>
      </motion.div>

    </div>
  );
}
