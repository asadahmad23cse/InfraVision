"use client";

import './globals.css';
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide global nav on dashboard pages to avoid mobile menu conflicts
  const isDashboard = pathname?.startsWith('/sustainability-intelligence');

  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] selection:bg-[#00A8E8]/30">
        {!isDashboard && (
          <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#020202]/60 backdrop-blur-3xl border-b border-white/[0.04]">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00A8E8]/40 to-transparent opacity-80" />
          <div className="max-w-[1600px] mx-auto px-6 py-2">
            <div className="flex items-center justify-between">
              <Link href="/" className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-105">
                 <div className="w-5 h-5 rounded-[4px] bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(0,168,232,0.4)] transition-shadow">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#050505]" />
                 </div>
                 <span className="text-lg tracking-tight font-medium text-white/90">
                    Infra<span className="text-white/40 font-light">Vision</span>
                 </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="relative text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-white font-medium transition-colors group">
                  Home
                  <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
                <Link href="/ai-features" className="relative text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-white font-medium transition-colors group">
                  Platform Architecture
                  <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
                <Link href="/sustainability-intelligence" className="relative text-[10px] uppercase tracking-[0.15em] text-[#00A8E8]/80 hover:text-[#00A8E8] font-bold transition-all group drop-shadow-[0_0_10px_rgba(0,168,232,0.3)]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00A8E8] mr-1.5 animate-pulse shadow-[0_0_5px_#00A8E8]" />
                  Intelligence Live
                  <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00A8E8]/70 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
                <Link href="/sustainability-intelligence" className="relative group overflow-hidden text-[10px] font-bold uppercase tracking-widest bg-white text-black px-5 py-1.5 rounded-full hover:scale-105 hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] skew-x-[-20deg] transition-transform duration-700 ease-in-out pointer-events-none" />
                  <span className="relative z-10">Access Core</span>
                </Link>
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden text-white/70 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-[#020202]/95 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-sm uppercase tracking-widest text-white/70 hover:text-white">Home</Link>
              <Link href="/ai-features" onClick={() => setIsMenuOpen(false)} className="text-sm uppercase tracking-widest text-white/70 hover:text-white">Architecture</Link>
              <Link href="/sustainability-intelligence" onClick={() => setIsMenuOpen(false)} className="text-sm uppercase tracking-widest text-[#00A8E8] font-bold">Intelligence Live</Link>
              <Link href="/sustainability-intelligence" onClick={() => setIsMenuOpen(false)} className="bg-white text-black text-center py-3 rounded-xl font-bold">Access Core</Link>
            </div>
          )}
        </nav>
        )}
        <main className="bg-[#050505] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

