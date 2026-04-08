// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/70 backdrop-blur-2xl border-b border-white/[0.05]">
          <div className="max-w-[1600px] mx-auto px-6 py-2">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-lg tracking-tight text-white font-medium flex items-center gap-2 transition-transform hover:scale-105">
                 <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#050505]" />
                 </div>
                 Infra<span className="text-white/40 font-light">Vision</span>
              </Link>
              <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white font-medium transition-colors">
                  Home
                </Link>
                <Link href="/ai-features" className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white font-medium transition-colors">
                  Platform Architecture
                </Link>
                <Link href="/sustainability-intelligence" className="text-[10px] uppercase tracking-widest text-[#34D399]/70 hover:text-[#34D399] font-medium transition-colors">
                  Intelligence Live
                </Link>
                <Link href="/sustainability-intelligence" className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-5 py-1.5 rounded-full hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  Access Core
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="bg-[#050505] min-h-screen">{children}</main>
      </body>
    </html>
  );
}

