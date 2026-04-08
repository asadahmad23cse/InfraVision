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
      <aside className="w-64 bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col fixed left-0 top-[45px] bottom-0 z-30 shadow-2xl shadow-black/50">
        <div className="p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TreePine className="w-5 h-5 text-white" />
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              InfraVision
            </span>
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 transition-all duration-300 group ${isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/5 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-100 border border-transparent'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm font-medium tracking-wide">{label}</span>
              </Link>
            );
          })}

          {/* AI Engine Section */}
          <div className="mt-5 mb-3 px-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">AI Engine</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
          </div>
          {aiNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 transition-all duration-300 group ${isActive
                    ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/5 text-violet-400 border border-violet-500/20 shadow-md shadow-violet-500/5'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-100 border border-transparent'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`} />
                <span className="text-sm font-medium tracking-wide">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-gray-500 bg-black/20 flex justify-between items-center backdrop-blur-md">
          <span>Delhi Smart City</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider ring-1 ring-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]">PRO</span>
        </div>
      </aside>

      {/* Main content - added framer-motion ready wrapper styling */}
      <main className="flex-1 ml-64 min-h-screen relative overflow-hidden">
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
