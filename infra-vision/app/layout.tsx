// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#00A8E8] to-[#34D399] bg-clip-text text-transparent">
                InfraVision
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/" className="text-gray-700 hover:text-[#00A8E8] font-medium transition-colors">
                  Home
                </Link>
                <Link href="/ai-features" className="text-gray-700 hover:text-[#00A8E8] font-medium transition-colors">
                  AI Features
                </Link>
                <Link href="/sustainability-intelligence" className="text-gray-700 hover:text-[#22c55e] font-medium transition-colors">
                  Sustainability Intel
                </Link>
                <Link href="/login" className="text-gray-700 hover:text-[#00A8E8] font-medium transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}

