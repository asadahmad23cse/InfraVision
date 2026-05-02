'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, FileJson, Printer, ShieldAlert, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { getOverview, getFullData } from '@/lib/sustainabilityApi';

export default function ReportsPage() {
  const [year, setYear] = useState(2025);
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

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = fullData[0] ? Object.keys(fullData[0]) : [];
    const csv = [headers.join(','), ...fullData.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InfraVision_Report_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalZones = fullData.filter(d => (d.water_stress_index || 0) > 0.6 || (d.ghg_emissions_mtco2 || 0) > 10);
  const safeZones = fullData.filter(d => (d.water_stress_index || 0) < 0.3 && (d.green_sqm_per_capita || 0) > 8);

  return (
    <div className="p-8 max-w-[1200px] mx-auto min-h-screen pb-20">
      
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-10 no-print">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-pulse"></div>
            <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Intelligence Egress</p>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">System Intelligence Reports</h1>
          <p className="text-gray-400 mt-2 max-w-xl font-medium">Generate, analyze, and serialize high-fidelity sustainability audits for policy intervention.</p>
        </motion.div>

        <div className="flex gap-3">
          <button onClick={handlePrint} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white" title="Print Report">
            <Printer className="w-5 h-5" />
          </button>
          <div className="relative group">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold appearance-none outline-none pr-10 cursor-pointer shadow-lg shadow-indigo-600/20">
              {Array.from({ length: 11 }, (_, i) => 2020 + i).map(y => <option key={y} value={y}>{y} Fiscal Year</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 text-xs">▼</div>
          </div>
        </div>
      </div>

      {/* ── THE ACTUAL REPORT (PRINTABLE) ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-slate-900 overflow-hidden relative print:shadow-none print:p-0 print:m-0 print:rounded-none">
        
        {/* Report Watermark/Background Decoration */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none no-print">
          <FileText className="w-64 h-64" />
        </div>

        {/* Report Header */}
        <div className="border-b-4 border-indigo-600 pb-8 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-5xl font-black tracking-tighter text-indigo-900 uppercase">Audit Report</h2>
            <p className="text-slate-500 font-bold mt-1 tracking-widest">INFRAVISION DIGITAL TWIN · FISCAL {year}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs font-black uppercase mb-1">Generated On</p>
            <p className="text-slate-900 font-mono font-bold text-sm">{new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Executive Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[
            { label: 'City Sustainability Index', value: overview?.city_sustainability_score || '0.0', trend: '+2.4%', color: 'bg-indigo-50' },
            { label: 'Aggregate Water Gap', value: `${overview?.water_gap_mgd || '0'} MGD`, trend: 'Critical', color: 'bg-rose-50' },
            { label: 'Renewable Adoption', value: `${overview?.renewable_share_percent || '0'}%`, trend: 'Improving', color: 'bg-emerald-50' },
            { label: 'Waste Recovery Rate', value: `${overview?.waste_processing_rate || '0'}%`, trend: 'Stable', color: 'bg-amber-50' },
          ].map((m, i) => (
            <div key={i} className={`${m.color} p-6 rounded-3xl border border-black/5`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{m.label}</p>
              <p className="text-3xl font-black text-slate-900">{m.value}</p>
              <span className="text-[10px] font-bold text-slate-500 mt-2 block italic">{m.trend} from baseline</span>
            </div>
          ))}
        </div>

        {/* Regional Intelligence Section */}
        <div className="grid grid-cols-2 gap-10 mb-12">
          <div>
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> High Risk Priority Zones
            </h3>
            <div className="space-y-3">
              {criticalZones.slice(0, 4).map((z, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs">{i+1}</span>
                    <span className="font-bold text-slate-800">{z.zone} Zone</span>
                  </div>
                  <span className="text-[10px] font-black text-rose-600 uppercase">Critical Stress</span>
                </div>
              ))}
              {criticalZones.length === 0 && <p className="text-slate-400 italic text-sm">No zones exceeding critical risk thresholds.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Leading Resilient Zones
            </h3>
            <div className="space-y-3">
              {safeZones.slice(0, 4).map((z, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">{i+1}</span>
                    <span className="font-bold text-slate-800">{z.zone} Zone</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase">Policy Success</span>
                </div>
              ))}
              {safeZones.length === 0 && <p className="text-slate-400 italic text-sm">Target zones still in transition phase.</p>}
            </div>
          </div>
        </div>

        {/* Strategic Roadmap */}
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Strategic Policy Roadmap {year}
            </h3>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30">AI Generated Insight</span>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Priority 01</p>
              <p className="text-sm font-medium leading-relaxed opacity-80">Accelerate water recycling infrastructure in {criticalZones[0]?.zone || 'Central'} to mitigate MGD deficit.</p>
            </div>
            <div className="space-y-2">
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Priority 02</p>
              <p className="text-sm font-medium leading-relaxed opacity-80">Scale solar grid parity in North-West sector to offset grid-based GHG intensity.</p>
            </div>
            <div className="space-y-2">
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Priority 03</p>
              <p className="text-sm font-medium leading-relaxed opacity-80">Implement circular waste economy in South-East to reach 85% processing target.</p>
            </div>
          </div>
        </div>

        {/* Final Disclaimer/Signature Area */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Info className="w-4 h-4" />
            <p className="text-[9px] font-medium max-w-[400px]">This audit is mathematically generated by InfraVision Digital Twin. All values are benchmark-normalized. Authorized for policy simulation use only.</p>
          </div>
          <div className="text-right">
             <div className="w-32 h-1 bg-slate-900 mb-2 ml-auto" />
             <p className="text-[10px] font-black text-slate-900 uppercase">Chief Infrastructure Architect</p>
          </div>
        </div>
      </motion.div>

      {/* ── External Export (Floating Bottom) ── */}
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 no-print z-[100]">
        <div className="flex items-center gap-6">
          <button onClick={handleExportCSV} className="flex items-center gap-2 text-white/60 hover:text-emerald-400 transition-colors text-xs font-bold uppercase tracking-widest">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button onClick={() => {}} className="flex items-center gap-2 text-white/60 hover:text-indigo-400 transition-colors text-xs font-bold uppercase tracking-widest">
            <FileJson className="w-4 h-4" /> Export JSON
          </button>
        </div>
        <button onClick={handlePrint} className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-lg">
          Generate Full PDF Report
        </button>
      </motion.div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; background: white !important; }
          .no-print { display: none !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          main { padding: 0 !important; margin: 0 !important; }
          .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-indigo-600 { background: #4f46e5 !important; -webkit-print-color-adjust: exact; }
          .text-indigo-900 { color: #312e81 !important; }
          .bg-rose-50 { background: #fff1f2 !important; -webkit-print-color-adjust: exact; }
          .bg-emerald-50 { background: #ecfdf5 !important; -webkit-print-color-adjust: exact; }
          .bg-indigo-50 { background: #eef2ff !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
