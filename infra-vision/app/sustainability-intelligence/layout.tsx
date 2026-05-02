'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
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
  Menu,
  X,
  ChevronRight,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#010103] text-gray-100 flex selection:bg-[#00A8E8]/30 overflow-x-hidden">
      
      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-black/40 backdrop-blur-xl border-b border-white/5 z-[60] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-[#00A8E8] shadow-[0_0_8px_#00A8E8]" />
           <span className="text-xs font-black tracking-widest uppercase text-white/90">InfraVision</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Overlay (Mobile Only) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#020205]/95 lg:bg-[#020205]/80 backdrop-blur-[64px] border-r border-white/[0.04] flex flex-col shadow-[4px_0_40px_rgba(0,0,0,0.6)]
        transition-transform duration-500 ease-in-out lg:translate-x-0 lg:pt-[45px]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none z-[-1]" />

        {/* Brand (Mobile Sidebar Header) */}
        <div className="lg:hidden px-6 py-6 border-b border-white/[0.04]">
           <h2 className="text-xl font-black text-white tracking-tighter">INFRAVISION</h2>
           <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Sustainability Twin</p>
        </div>

        <div className="px-5 py-5 border-b border-white/[0.04] relative overflow-hidden hidden lg:block">
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

        <nav className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mb-3 px-3 pt-2">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Dashboards</p>
          </div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-1 transition-all duration-300 relative group overflow-hidden ${isActive
                  ? 'text-white bg-white/5'
                  : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'
                  }`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-[#00A8E8]' : 'opacity-70 group-hover:scale-110'}`} />
                  <span className={`text-[12px] font-semibold tracking-wide ${isActive ? 'text-white' : 'font-medium'}`}>{label}</span>
                </div>
                {isActive && <motion.div layoutId="active-pill" className="w-1 h-4 bg-[#00A8E8] rounded-full shadow-[0_0_8px_#00A8E8]" />}
              </Link>
            );
          })}

          <div className="mt-10 mb-3 px-3">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Core Engines</p>
          </div>
          {aiNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-1 transition-all duration-300 relative group overflow-hidden ${isActive
                  ? 'text-white bg-white/5'
                  : 'text-white/40 hover:bg-white/[0.02] hover:text-white/80'
                  }`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-white' : 'opacity-70 group-hover:scale-110'}`} />
                  <span className={`text-[12px] font-semibold tracking-wide ${isActive ? 'text-white' : 'font-medium'}`}>{label}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-white/40" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.04] bg-black/40 flex justify-between items-center backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-0.5">Deployment</span>
            <span className="text-xs text-white/80 font-semibold tracking-tight">Delhi Nodes</span>
          </div>
          <span className="px-2 py-0.5 rounded shadow-[0_0_15px_rgba(255,255,255,0.1)] bg-white/10 text-white text-[9px] font-black tracking-widest border border-white/20 backdrop-blur-md uppercase">Pro</span>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main className={`
        flex-1 min-h-screen relative overflow-hidden transition-all duration-500
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-64'} 
        ml-0 pt-14 lg:pt-[48px]
      `}>
        {/* Luxurious Volumetric Ambient Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none z-0"></div>
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A8E8]/[0.05] via-transparent to-transparent pointer-events-none z-0"></div>

        <div className="relative z-10 w-full h-full p-4 lg:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
