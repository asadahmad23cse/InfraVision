import React from 'react';
import { ShieldCheck, Zap, Cpu, AlertTriangle } from 'lucide-react';

const ResearchIntelligencePanel = () => {
  const insights = [
    {
      label: "Confidence Explanation",
      value: "92% Confidence",
      detail: "Derived from mean R² across 4 validation sectors.",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
    },
    {
      label: "Causality Insight",
      value: "r = 0.84",
      detail: "Temp rise correlates with +12% marginal Energy Load.",
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      color: "border-amber-500/20 bg-amber-500/5 text-amber-200"
    },
    {
      label: "Explainability (SHAP)",
      value: "Pop Density: 42%",
      detail: "Primary driver of Water Stress in North/West zones.",
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      color: "border-cyan-500/20 bg-cyan-500/5 text-cyan-200"
    },
    {
      label: "Projected Risk",
      value: "Critical Alert",
      detail: "Trajectory implies 15% Water deficit increase by 2030.",
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      color: "border-rose-500/20 bg-rose-500/5 text-rose-200"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      {insights.map((item, idx) => (
        <div key={idx} className={`p-4 rounded-2xl border ${item.color} backdrop-blur-sm transition-all hover:scale-[1.02] cursor-default`}>
          <div className="flex items-center gap-2 mb-2">
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{item.label}</span>
          </div>
          <p className="text-sm font-black mb-1">{item.value}</p>
          <p className="text-[10px] leading-relaxed opacity-70">{item.detail}</p>
        </div>
      ))}
    </div>
  );
};

export default ResearchIntelligencePanel;
