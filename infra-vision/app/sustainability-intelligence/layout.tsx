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
    <div className="min-h-screen bg-[#010103] text-gray-100 flex selection:bg-[#00A8E8]/30">
      {/* Sidebar - Advanced Luxury Glassmorphism */}
      <aside className="w-64 bg-[#020205]/80 backdrop-blur-[64px] border-r border-white/[0.04] flex flex-col fixed left-0 top-[45px] bottom-0 z-30 shadow-[4px_0_40px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none z-[-1]" />
        
        <div className="px-5 py-4 border-b border-white/[0.04] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A8E8]/10 to-transparent opacity-50" />
          <p className="relative text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1.5">Workspace</p>
          <div className="relative flex items-center gap-2.5">
            <div className="relative flex h-3 w-3 items-center justify-center">
               <span className="absolute inline-flex w-full h-full rounded-full bg-[#00A8E8] opacity-40 animate-ping"></span>
               <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#00A8E8] shadow-[0_0_8px_#00A8E8]"></span>
            </div>
            <h2 className="text-[13px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-wider uppercase">
              Intelligence
            </h2>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mb-2 px-3 pt-2">
             <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Dashboards</p>
          </div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-300 relative group overflow-hidden ${isActive
                    ? 'text-white'
                    : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'
                  }`}
              >
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00A8E8]/[0.08] to-transparent pointer-events-none" />
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-[#00A8E8] rounded-r-full shadow-[0_0_12px_rgba(0,168,232,0.8)]" />
                  </>
                )}
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-[#00A8E8] drop-shadow-[0_0_8px_rgba(0,168,232,0.5)]' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'}`} />
                <span className={`text-[12.5px] font-semibold tracking-wide ${isActive ? 'drop-shadow-md' : 'font-medium'}`}>{label}</span>
              </Link>
            );
          })}

          <div className="mt-8 mb-2 px-3">
             <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Core Engines</p>
          </div>
          {aiNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-300 relative group overflow-hidden ${isActive
                    ? 'text-white'
                    : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'
                  }`}
              >
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] to-transparent pointer-events-none" />
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-white rounded-r-full shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                  </>
                )}
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'}`} />
                <span className={`text-[12.5px] font-semibold tracking-wide ${isActive ? 'drop-shadow-md' : 'font-medium'}`}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/[0.04] bg-black/40 flex justify-between items-center backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[8.5px] font-bold text-white/30 uppercase tracking-[0.2em] mb-0.5">Deployment</span>
            <span className="text-xs text-white/80 font-semibold tracking-tight">Delhi Grid Nodes</span>
          </div>
          <span className="px-1.5 py-0.5 rounded shadow-[0_0_15px_rgba(255,255,255,0.1)] bg-white/10 text-white text-[9px] font-black tracking-widest border border-white/20 backdrop-blur-md uppercase">Pro</span>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main className="flex-1 ml-64 min-h-screen relative overflow-hidden pt-[48px]">
        {/* Luxurious Volumetric Ambient Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none z-0"></div>
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A8E8]/[0.05] via-transparent to-transparent pointer-events-none z-0"></div>
        <div className="absolute top-[10%] right-[-10%] w-[1200px] h-[1200px] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-violet-900/10 to-transparent blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-teal-900/10 to-transparent blur-[120px] pointer-events-none z-0"></div>
        
        {/* Micro-grid overlay for structural tech feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
