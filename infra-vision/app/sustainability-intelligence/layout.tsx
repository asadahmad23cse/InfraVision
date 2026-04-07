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
  Hexagon,
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
  { href: '/sustainability-intelligence/explainability', icon: Brain, label: 'Algorithm Transparency' },
];

export default function SustainabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 flex selection:bg-white/20">
      {/* Sidebar - Minimalist True Dark */}
      <aside className="w-[280px] bg-[#050505] border-r border-white-[0.04] flex flex-col fixed left-0 top-16 bottom-0 z-30">
        
        {/* Brand Header */}
        <div className="px-8 mt-8 mb-6">
          <h2 className="text-xl font-light text-white flex items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-[#0f0f11] border border-white/10 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white/90" />
            </span>
            <span className="tracking-tight text-white/90 font-medium">
              Infra<span className="font-light text-white/50">Vision</span>
            </span>
          </h2>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
          
          <div className="mb-8">
             <p className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 mb-3">Core Modules</p>
             <div className="flex flex-col gap-1">
               {navItems.map(({ href, icon: Icon, label }) => {
                 const isActive = pathname === href;
                 return (
                   <Link
                     key={href}
                     href={href}
                     className={`relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                       isActive
                         ? 'bg-white/[0.06] text-white'
                         : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'
                     }`}
                   >
                     {isActive && (
                       <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />
                     )}
                     <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-white' : 'group-hover:text-white/80'}`} />
                     <span className={`text-[13px] tracking-wide ${isActive ? 'font-medium' : 'font-normal'}`}>{label}</span>
                   </Link>
                 );
               })}
             </div>
          </div>

          <div>
             <p className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 mb-3">AI Engine</p>
             <div className="flex flex-col gap-1">
               {aiNavItems.map(({ href, icon: Icon, label }) => {
                 const isActive = pathname === href || pathname.startsWith(href);
                 return (
                   <Link
                     key={href}
                     href={href}
                     className={`relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                       isActive
                         ? 'bg-white/[0.06] text-white'
                         : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'
                     }`}
                   >
                     {isActive && (
                       <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />
                     )}
                     <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-white' : 'group-hover:text-white/80'}`} />
                     <span className={`text-[13px] tracking-wide ${isActive ? 'font-medium' : 'font-normal'}`}>{label}</span>
                   </Link>
                 );
               })}
             </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.04]">
           <div className="flex justify-between items-center bg-[#0f0f11] border border-white/5 rounded-2xl px-4 py-3">
             <span className="text-xs font-medium text-white/60 tracking-wider">Delhi Smart City</span>
             <span className="px-2 py-0.5 rounded-full border border-white/20 text-white/80 text-[9px] font-bold tracking-widest uppercase">PRO</span>
           </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[280px] min-h-screen relative overflow-hidden bg-[#050505]">
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
