'use client';

import Link from 'next/link';
import { 
  Activity, TrendingUp, BarChart2, Zap, ArrowUpRight, CheckCircle2, 
  Target, Crosshair, Layers 
} from 'lucide-react';

const strategies = [
  { path: '/adx_fib_pullback', title: 'ADX Fib Pullback', description: 'Trend continuation strategy using ADX and Fibonacci retracements.', icon: Activity, category: 'Trend Following' },
  { path: '/bb_adx_rsi', title: 'BB ADX RSI', description: 'Combines Bollinger Bands, ADX, and RSI for high-probability setups.', icon: Layers, category: 'Oscillator' },
  { path: '/bb_ha_momentum', title: 'BB HA Momentum', description: 'Momentum trading utilizing Heikin Ashi candles and Bollinger Bands.', icon: Zap, category: 'Momentum' },
  { path: '/cci_ema', title: 'CCI EMA', description: 'Trend filtering with EMA and momentum entry via CCI.', icon: Target, category: 'Trend Following' },
  { path: '/double_cci', title: 'Double CCI', description: 'Dual timeframe Commodity Channel Index strategy for robust entries.', icon: Target, category: 'Oscillator' },
  { path: '/ema_macd', title: 'EMA MACD', description: 'Classic trend-following using Exponential Moving Averages and MACD.', icon: TrendingUp, category: 'Trend Following' },
  { path: '/heikin_ashi_macd', title: 'Heikin Ashi MACD', description: 'Noise-filtered trend strategy pairing Heikin Ashi with MACD.', icon: BarChart2, category: 'Trend Following' },
  { path: '/heikinashi_supper_trend', title: 'HA SuperTrend', description: 'Strong trend capture using Heikin Ashi and the SuperTrend indicator.', icon: ArrowUpRight, category: 'Trend Following' },
  { path: '/ppo', title: 'PPO', description: 'Percentage Price Oscillator strategy for momentum and divergence.', icon: Crosshair, category: 'Oscillator' },
  { path: '/stoch_hma', title: 'Stoch HMA', description: 'Hull Moving Average with Stochastic Oscillator for smooth reversals.', icon: Activity, category: 'Reversal' },
  { path: '/stoch_macd', title: 'Stoch MACD', description: 'Confluence strategy using Stochastic and MACD for confirmation.', icon: Layers, category: 'Momentum' },
  { path: '/trend_pullback', title: 'Trend Pullback', description: 'Classic pullback strategy entering on minor retracements in a trend.', icon: TrendingUp, category: 'Trend Following' },
  { path: '/vwap_momentum', title: 'VWAP Momentum', description: 'Intraday momentum strategy anchored on Volume Weighted Average Price.', icon: BarChart2, category: 'Momentum' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-400 mb-6">
            <CheckCircle2 className="w-4 h-4" /> System Online
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Backtest Graveyard
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-neutral-400">
            A comprehensive visualization dashboard for algorithmic trading strategies. 
            Explore backtest results, equity curves, and performance metrics.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {strategies.map((strategy) => (
            <Link 
              key={strategy.path} 
              href={strategy.path}
              className="group relative flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-300">
                  <strategy.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 group-hover:text-indigo-400 transition-colors">
                    {strategy.category}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-200 group-hover:text-white transition-colors">
                    {strategy.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors mt-auto">
                {strategy.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
