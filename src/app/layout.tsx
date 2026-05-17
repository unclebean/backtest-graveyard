import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Home, LineChart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Backtest Graveyard',
  description: 'A comprehensive visualization dashboard for algorithmic trading strategies',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex flex-col">
        <Providers>
          <nav className="w-full border-b border-white/10 bg-[#0a0a0a]">
            <div className="px-4">
              <div className="flex items-center justify-between h-14">
                <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                  <LineChart className="w-5 h-5" />
                  <span className="font-bold tracking-wide">Backtest Graveyard</span>
                </Link>
                <div className="flex items-center gap-4">
                  <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                    <Home className="w-4 h-4" /> Home
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <div className="flex-1 w-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
