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
    <div className="min-h-screen bg-slate-900 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col fixed left-0 top-16 bottom-0 z-30">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TreePine className="w-4 h-4 text-emerald-400" />
            </span>
            Sustainability Intel
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:bg-slate-700/50 hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}

          {/* AI Engine Section */}
          <div className="mt-3 mb-2 px-3">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">AI Engine</p>
          </div>
          {aiNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'text-gray-400 hover:bg-slate-700/50 hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700 text-xs text-gray-500">
          Delhi Smart City
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
