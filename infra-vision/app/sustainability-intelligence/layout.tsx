'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Droplets,
  Zap,
  Recycle,
  TreePine,
  Flame,
  Sliders,
  Lightbulb,
  FileText,
  Network,
  Target,
  GitCompare,
  Brain,
} from 'lucide-react';

const navItems = [
  { href: '/sustainability-intelligence', icon: LayoutDashboard, label: 'Overview' },
  { href: '/sustainability-intelligence/water', icon: Droplets, label: 'Water Stress' },
  { href: '/sustainability-intelligence/energy', icon: Zap, label: 'Energy & Solar' },
  { href: '/sustainability-intelligence/waste', icon: Recycle, label: 'Waste & Circular' },
  { href: '/sustainability-intelligence/green', icon: TreePine, label: 'Green Space' },
  { href: '/sustainability-intelligence/carbon', icon: Flame, label: 'Carbon Footprint' },
  { href: '/sustainability-intelligence/policy', icon: Sliders, label: 'Policy Simulator' },
  { href: '/sustainability-intelligence/recommendations', icon: Lightbulb, label: 'AI Recommendations' },
  { href: '/sustainability-intelligence/reports', icon: FileText, label: 'Reports' },
];

const aiNavItems = [
  { href: '/sustainability-intelligence/digital-twin', icon: Network, label: 'Digital Twin' },
  { href: '/sustainability-intelligence/optimization', icon: Target, label: 'LP Optimizer' },
  { href: '/sustainability-intelligence/scenarios', icon: GitCompare, label: 'Scenarios' },
  { href: '/sustainability-intelligence/explainability', icon: Brain, label: 'Explainability (SHAP)' },
];

export default function SustainabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 flex selection:bg-cyan-500/30">
      {/* Sidebar - Glassmorphism */}
      <aside className="w-64 bg-[#050505]/70 backdrop-blur-3xl border-r border-white/[0.04] flex flex-col fixed left-0 top-[45px] bottom-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mb-1">Target</p>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00A8E8] shadow-[0_0_8px_#00A8E8] animate-pulse" />
            <h2 className="text-sm font-semibold text-white/90 tracking-tight">
              Intelligence Suite
            </h2>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mb-2 px-3 pt-2">
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Dashboards</p>
          </div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-all duration-200 relative group ${isActive
                    ? 'bg-white/[0.04] text-white'
                    : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80 border border-transparent'
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#00A8E8] rounded-r-full shadow-[0_0_10px_rgba(0,168,232,0.6)]" />}
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-[#00A8E8] drop-shadow-[0_0_8px_rgba(0,168,232,0.4)] scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className={`text-[12px] font-medium tracking-wide ${isActive ? 'text-white' : ''}`}>{label}</span>
              </Link>
            );
          })}

          <div className="mt-8 mb-2 px-3">
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Core Engines</p>
          </div>
          {aiNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-all duration-200 relative group ${isActive
                    ? 'bg-white/[0.04] text-white'
                    : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80 border border-transparent'
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.6)]" />}
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className={`text-[12px] font-medium tracking-wide ${isActive ? 'text-white' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/[0.04] bg-black/20 flex justify-between items-center backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Deployment</span>
            <span className="text-xs text-white/80 font-medium tracking-tight">Delhi Grid Nodes</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/90 text-[9px] font-bold tracking-widest border border-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)]">PRO</span>
        </div>
      </aside>

      {/* Main content - added framer-motion ready wrapper styling */}
      <main className="flex-1 ml-64 min-h-screen relative overflow-hidden pt-[48px]">
        {/* Subtle background noise/grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/20 via-[#0B1220] to-[#0B1220] pointer-events-none"></div>

        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
