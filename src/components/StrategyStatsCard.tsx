'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PlayCircle,
  Calendar,
  Layers,
  HelpCircle,
  Maximize2,
  Camera,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Coins,
  ShieldAlert,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTradePerformance } from '@/hooks/useTradePerformance';
import dayjs from 'dayjs';
import {
  createChart,
  BaselineSeries,
  HistogramSeries,
  IChartApi,
} from 'lightweight-charts';

interface StrategyStatsCardProps {
  name: string;
  symbol: string;
  strategy: string;
  onStartAction: () => void;
  subTitle?: string;
}

export default function StrategyStatsCard({
  name,
  symbol,
  strategy,
  onStartAction,
  subTitle,
}: Readonly<StrategyStatsCardProps>) {
  const { data, trades, isLoading, startDate, endDate } = useTradePerformance({
    symbol,
    strategy,
  });
  const [activeTab, setActiveTab] = useState<'metrics' | 'trades'>('metrics');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Checkboxes for the chart legend
  const [showEquity, setShowEquity] = useState(true);
  const [showBuyHold, setShowBuyHold] = useState(false);
  const [showVolatility, setShowVolatility] = useState(false);
  const [showDrawdown, setShowDrawdown] = useState(false);

  useEffect(() => {
    if (activeTab !== 'metrics' || !chartContainerRef.current || !data?.equityCurve || data.equityCurve.length === 0) {
      return;
    }

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      height: 320,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 10,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.15)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.15)' },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: '#9ca3af',
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          color: '#2962ff',
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: '#2962ff',
        },
        horzLine: {
          color: '#2962ff',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2962ff',
        },
      },
    });

    // Add Baseline Series for Equity Curve (grows green above 0, red below 0)
    const baselineSeries = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      topLineColor: '#10b981', // Emerald-500
      bottomLineColor: '#f43f5e', // Rose-500
      topFillColor1: 'rgba(16, 185, 129, 0.22)',
      topFillColor2: 'rgba(16, 185, 129, 0.02)',
      bottomFillColor1: 'rgba(244, 63, 94, 0.02)',
      bottomFillColor2: 'rgba(244, 63, 94, 0.22)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    // Add Histogram Series for individual trade results at the bottom
    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Set scale margins to separate both curves on the same chart
    baselineSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.35,
      },
    });

    histogramSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.72,
        bottom: 0.05,
      },
    });

    // Set data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baselineSeries.setData(data.equityCurve as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    histogramSeries.setData(data.tradePnLHistory as any);

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 320);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [activeTab, data?.equityCurve, data?.tradePnLHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-[#131722] text-[#d1d4dc] border border-[#2a2e39] rounded-2xl max-w-4xl w-full mx-auto shadow-2xl space-x-3">
        <Activity className="animate-spin text-[#2962ff]" />
        <span className="font-semibold text-sm tracking-wide">Loading performance report...</span>
      </div>
    );
  }

  // Calculate percentage returns
  const INITIAL_BALANCE = 10000;
  const netProfitPercent = (data.netProfit / INITIAL_BALANCE) * 100;
  const maxDrawdownPercent = (data.maxDrawdown / INITIAL_BALANCE) * 100;
  const isNetProfitPositive = data.netProfit >= 0;

  return (
    <Card className="w-full max-w-full mx-auto bg-[#131722] border border-[#2a2e39] text-[#d1d4dc] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header Panel */}
      <div className="bg-[#1c2030]/80 px-6 py-4 border-b border-[#2a2e39] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-[#2962ff]/10 p-2 rounded-lg border border-[#2962ff]/30 text-[#2962ff]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Strategy Report
              <span className="text-xs font-normal text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 uppercase">
                Ready
              </span>
            </h2>
            <div className="text-xs text-neutral-400 font-medium">Desktop Analytics Engine</div>
          </div>
        </div>

        {/* Date period and Start button */}
        <div className="flex flex-wrap items-center gap-3">
          {startDate && endDate && (
            <div className="flex items-center space-x-2 bg-[#2a2e39]/50 border border-[#2a2e39] px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
              <Calendar className="w-3.5 h-3.5 text-[#2962ff]" />
              <span>
                {dayjs(startDate).format('MMM D, YYYY')} — {dayjs(endDate).format('MMM D, YYYY')}
              </span>
            </div>
          )}

          <Button
            size="sm"
            onClick={onStartAction}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold rounded-lg px-4 py-1.5 flex items-center gap-2 shadow-lg shadow-emerald-950/20 transition-all duration-150"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Replay</span>
          </Button>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Strategy Title & Tabs Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a2e39]/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#2962ff] text-white hover:bg-[#2962ff]/90 text-[10px] tracking-widest px-2.5 py-0.5 rounded uppercase font-bold">
                {symbol}
              </Badge>
              <h1 className="text-xl font-black text-white tracking-tight">{name}</h1>
            </div>
            {subTitle && (
              <p className="text-xs text-neutral-400 font-medium">{subTitle}</p>
            )}
          </div>

          {/* Navigation Tabs (English-first) */}
          <div className="flex bg-[#1c2030] p-1 rounded-lg border border-[#2a2e39] self-start md:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-all duration-150 cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-[#2962ff] text-white shadow-lg shadow-[#2962ff]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-all duration-150 cursor-pointer ${
                activeTab === 'trades'
                  ? 'bg-[#2962ff] text-white shadow-lg shadow-[#2962ff]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Trade List
            </button>
          </div>
        </div>

        {/* Horizontal Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Net Profit Card */}
          <div className="bg-[#1c2030]/50 border border-[#2a2e39] p-4 rounded-xl space-y-1.5 shadow-sm hover:border-[#2a2e39]/80 transition duration-150">
            <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase flex items-center justify-between">
              <span>Total PnL</span>
              {isNetProfitPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              )}
            </div>
            <div className="space-y-0.5">
              <div className={`text-lg font-black tracking-tight ${isNetProfitPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isNetProfitPositive ? '+' : ''}
                {data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-[10px] font-bold ml-1">USD</span>
              </div>
              <div className={`text-xs font-bold ${isNetProfitPositive ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                {isNetProfitPositive ? '+' : ''}
                {netProfitPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Max Drawdown Card */}
          <div className="bg-[#1c2030]/50 border border-[#2a2e39] p-4 rounded-xl space-y-1.5 shadow-sm hover:border-[#2a2e39]/80 transition duration-150">
            <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase flex items-center justify-between">
              <span>Max Drawdown</span>
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-[#f43f5e] tracking-tight">
                {data.maxDrawdown.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-[10px] font-bold ml-1 text-neutral-400">USD</span>
              </div>
              <div className="text-xs text-rose-500/80 font-bold">
                -{maxDrawdownPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Total Trades Card */}
          <div className="bg-[#1c2030]/50 border border-[#2a2e39] p-4 rounded-xl space-y-1.5 shadow-sm hover:border-[#2a2e39]/80 transition duration-150">
            <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase flex items-center justify-between">
              <span>Total Trades</span>
              <Coins className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-white tracking-tight">
                {trades.length}
              </div>
              <div className="text-xs text-neutral-400 font-semibold uppercase">
                Executed
              </div>
            </div>
          </div>

          {/* Win Rate Card */}
          <div className="bg-[#1c2030]/50 border border-[#2a2e39] p-4 rounded-xl space-y-1.5 shadow-sm hover:border-[#2a2e39]/80 transition duration-150">
            <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase flex items-center justify-between">
              <span>Win Rate</span>
              <Percent className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-yellow-500 tracking-tight">
                {data.winRate.toFixed(2)}%
              </div>
              <div className="text-xs text-neutral-400 font-bold">
                {data.win}W — {data.loss}L
              </div>
            </div>
          </div>

          {/* Profit Factor Card */}
          <div className="bg-[#1c2030]/50 border border-[#2a2e39] p-4 rounded-xl space-y-1.5 shadow-sm hover:border-[#2a2e39]/80 transition duration-150">
            <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase flex items-center justify-between">
              <span>Profit Factor</span>
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="space-y-0.5">
              <div className={`text-lg font-black tracking-tight ${data.profitFactor >= 1.0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {data.profitFactor.toFixed(3)}
              </div>
              <div className="text-xs text-neutral-400 font-semibold uppercase">
                {data.profitFactor >= 1.0 ? 'Profitable' : 'Unprofitable'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab content 1: Metrics Dashboard with interactive chart */}
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Controls (English-first) */}
            <div className="lg:col-span-1 bg-[#1c2030]/40 border border-[#2a2e39]/80 p-5 rounded-2xl space-y-5 h-fit shadow-sm">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#2a2e39]/50">
                <Layers className="w-4 h-4 text-[#2962ff]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Chart Overlays</span>
              </div>

              <div className="space-y-3.5 text-xs font-medium text-neutral-300">
                {/* Equity Layer Toggle */}
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showEquity}
                    onChange={(e) => setShowEquity(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#2962ff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="group-hover:text-white transition duration-100 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400/30"></span>
                    Equity Curve
                  </span>
                </label>

                {/* Buy & Hold Toggle (Disabled mockup) */}
                <label className="flex items-center space-x-3 cursor-pointer group opacity-40">
                  <input
                    type="checkbox"
                    checked={showBuyHold}
                    onChange={(e) => setShowBuyHold(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#2962ff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="group-hover:text-white transition duration-100 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-neutral-500"></span>
                    Buy and Hold
                  </span>
                </label>

                {/* Trade Fluctuation Toggle (Disabled mockup) */}
                <label className="flex items-center space-x-3 cursor-pointer group opacity-40">
                  <input
                    type="checkbox"
                    checked={showVolatility}
                    onChange={(e) => setShowVolatility(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#2962ff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="group-hover:text-white transition duration-100">
                    Trade Volatility
                  </span>
                </label>

                {/* Run-up / Drawdown Toggle (Disabled mockup) */}
                <label className="flex items-center space-x-3 cursor-pointer group opacity-40">
                  <input
                    type="checkbox"
                    checked={showDrawdown}
                    onChange={(e) => setShowDrawdown(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#2962ff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="group-hover:text-white transition duration-100">
                    Drawdown Layers
                  </span>
                </label>
              </div>

              {/* Notice Panel */}
              <div className="pt-4 border-t border-[#2a2e39]/50 space-y-2">
                <div className="text-[10px] text-neutral-400 leading-normal flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#2962ff] shrink-0 mt-0.5" />
                  <span>
                    All calculations are anchored to a standardized starting equity of **$10,000 USD** with exact cumulative return calculations.
                  </span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="lg:col-span-3 bg-[#1c2030]/20 border border-[#2a2e39]/80 rounded-2xl shadow-sm p-4 relative space-y-4">
              {/* Chart Panel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39]/30">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Equity Curve Chart</span>
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-500 cursor-pointer hover:text-white transition duration-100" />
                </div>

                {/* Mock Utility Icons matching screenshot */}
                <div className="flex items-center space-x-2 text-neutral-500">
                  <button className="p-1 hover:text-white rounded border border-transparent hover:border-[#2a2e39] transition duration-100">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 hover:text-white rounded border border-transparent hover:border-[#2a2e39] transition duration-100">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chart Mounting Element */}
              <div ref={chartContainerRef} className="w-full relative min-h-[320px]" />
            </div>
          </div>
        )}

        {/* Tab content 2: Tabular list of executed trades */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Completed Transactions</span>
              <span className="text-xs text-neutral-400 font-semibold">{trades.length} Records</span>
            </div>

            {/* Scrollable Table Wrapper */}
            <div className="overflow-x-auto border border-[#2a2e39] rounded-xl max-h-[380px] overflow-y-auto shadow-sm">
              <table className="min-w-full divide-y divide-[#2a2e39]/60 text-left text-xs text-[#d1d4dc]">
                <thead className="bg-[#1c2030]/80 sticky top-0 z-10 text-neutral-400 uppercase font-bold text-[9px] tracking-wider border-b border-[#2a2e39]">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Side</th>
                    <th className="px-5 py-3.5">Entry Date & Price</th>
                    <th className="px-5 py-3.5">Exit Date & Price</th>
                    <th className="px-5 py-3.5 text-right">Qty</th>
                    <th className="px-5 py-3.5 text-right">Fee</th>
                    <th className="px-5 py-3.5 text-right">PnL (USD)</th>
                    <th className="px-5 py-3.5 text-right">PnL (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]/30 bg-[#131722]/40">
                  {trades.map((trade, idx) => {
                    const tradePnL = trade.result;
                    const isProfit = tradePnL >= 0;
                    const tradePercent = (tradePnL / INITIAL_BALANCE) * 100;
                    const isLong = trade.trend?.toLowerCase() === 'long' || trade.trend?.toLowerCase() === 'up' || tradePnL >= 0; // fallback logic
                    
                    return (
                      <tr key={trade.id || idx} className="hover:bg-[#1c2030]/40 transition duration-100">
                        {/* Trade ID */}
                        <td className="px-5 py-3.5 font-mono text-[10px] text-neutral-400">
                          #{trade.id?.substring(0, 8) || (idx + 1)}
                        </td>

                        {/* Trade Side badge */}
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isLong 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isLong ? 'Long' : 'Short'}
                          </span>
                        </td>

                        {/* Entry Date & Price */}
                        <td className="px-5 py-3.5 space-y-0.5">
                          <div className="font-semibold text-white">
                            {trade.opened_position.toLocaleString(undefined, { minimumFractionDigits: 4 })}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {dayjs(trade.entry_date).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </td>

                        {/* Exit Date & Price */}
                        <td className="px-5 py-3.5 space-y-0.5">
                          <div className="font-semibold text-white">
                            {trade.closed_position.toLocaleString(undefined, { minimumFractionDigits: 4 })}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {dayjs(trade.exit_date).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="px-5 py-3.5 text-right font-semibold font-mono">
                          {trade.quantity}
                        </td>

                        {/* Fee */}
                        <td className="px-5 py-3.5 text-right font-mono text-neutral-400">
                          {isForex(symbol) ? '$6.00' : `$${(trade.opened_position * trade.quantity * 0.0005 * 2).toFixed(3)}`}
                        </td>

                        {/* PnL USD */}
                        <td className={`px-5 py-3.5 text-right font-bold font-mono ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? '+' : ''}
                          {tradePnL.toFixed(2)}
                        </td>

                        {/* PnL % */}
                        <td className={`px-5 py-3.5 text-right font-bold font-mono ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? '+' : ''}
                          {tradePercent.toFixed(3)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Summary Footer */}
            <div className="bg-[#1c2030]/30 border border-[#2a2e39] rounded-xl px-5 py-3 text-xs text-neutral-400 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-1">
                <span>Completed backtest run of</span>
                <span className="font-semibold text-white">{trades.length} transactions</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  Wins: <span className="font-semibold text-emerald-400">{data.win}</span>
                </span>
                <span className="flex items-center gap-1">
                  Losses: <span className="font-semibold text-rose-400">{data.loss}</span>
                </span>
                <span className="flex items-center gap-1">
                  Ratio: <span className="font-semibold text-yellow-500">{(data.win / (data.loss || 1)).toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple helper inside component to determine symbol type
function isForex(symbol: string) {
  const forexSymbols = ['EUR', 'GBP', 'USD', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
  return forexSymbols.some((f) => symbol.toUpperCase().includes(f));
}
