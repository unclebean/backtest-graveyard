'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { CandlestickChartReplayWithPositions } from '@/components/CandlestickChartReplayWithPositions';
import { IChartApi } from 'lightweight-charts';
import { Position } from '@/types/chart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
import { useBacktestData } from '@/hooks/useBacktestData';
import StrategyStatsCard from '@/components/StrategyStatsCard';

import { useEma } from '@/hooks/useEma';
import { useAdxChart } from '@/hooks/useAdxChart';
import { useRsiChart } from '@/hooks/useRsiChart';

const SYMBOL = 'ETH';
const STRATEGY = 'trend_pullback';
const DESC = 'ETH/USDT';
const SUB_DESC = 'Trend Pullback Strategy';

interface HomePageProps {
  marketData: CandlestickData[];
  positions: Position[];
}

function HomePageInternal({ marketData, positions }: Readonly<HomePageProps>) {
  const [candlestickChart, setChart] = useState<IChartApi>();
  const [executedOrders, setExecutedOrders] = useState<OrderLog[]>([]);
  const indicatorChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);

  const [showOverlay, setShowOverlay] = useState(true);
  const [candles, setCandles] = useState([] as CandlestickData[]);
          const [isDone, setIsDone] = useState(false);

  const onFinish = useCallback(() => {
    setIsDone(true);
  }, []);

  
  useEma({
    candlesChart: candlestickChart,
    candlesticks: candles,
    period: 50,
  });

  const { adxChart } = useAdxChart({
    candlesticks: candles,
    indicatorChartRef: indicatorChartRef,
  });

  const { rsiChart } = useRsiChart({
    candlesticks: candles,
    indicatorChartRef: rsiChartRef,
  });

  const activeSourceChartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const charts = [adxChart, rsiChart, candlestickChart].filter(Boolean) as IChartApi[];

    const handlers = charts.map((sourceChart) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (range: any) => {
        if (!range || activeSourceChartRef.current !== sourceChart) return;
        
        charts.forEach((targetChart) => {
          if (targetChart !== sourceChart) {
            try {
              const targetRange = targetChart.timeScale().getVisibleLogicalRange();
              if (!targetRange || Math.abs(targetRange.from - range.from) > 0.5 || Math.abs(targetRange.to - range.to) > 0.5) {
                targetChart.timeScale().setVisibleLogicalRange(range);
              }
            } catch {
              // Safe catch for disposed charts during replay tick sync
            }
          }
        });
      };
      try {
        sourceChart.timeScale().subscribeVisibleLogicalRangeChange(handler);
      } catch {
        // Safe catch for initial/disposed subscriptions
      }
      return { chart: sourceChart, handler };
    });

    return () => {
      handlers.forEach(({ chart, handler }) => {
        try {
          chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
        } catch {
          // Safe catch for already disposed charts on unmount/re-render
        }
      });
    };
  }, [adxChart, rsiChart, candlestickChart]);

  if (showOverlay || isDone) {
    return (
      <main className="p-4 bg-black min-h-screen flex gap-8 justify-center items-center flex-row">
        <StrategyStatsCard
          name={DESC}
          subTitle={SUB_DESC}
          symbol={SYMBOL}
          strategy={STRATEGY}
          onStartAction={() => setShowOverlay(false)}
        />
      </main>
    );
  }

  return (
    <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        <div className="flex-1 min-h-[400px]" onMouseEnter={() => activeSourceChartRef.current = candlestickChart || null} onTouchStart={() => activeSourceChartRef.current = candlestickChart || null}>
            <CandlestickChartReplayWithPositions
              onOrdersUpdate={setExecutedOrders}
              title="ETH/USDT"
              initialBalance={10000}
              candlesticks={marketData}
              positions={positions}
              setChart={setChart}
              onFinish={onFinish}
              onTick={setCandles}
            />
        </div>
        <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden" onMouseEnter={() => activeSourceChartRef.current = adxChart || null} onTouchStart={() => activeSourceChartRef.current = adxChart || null}>
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white">
            ADX 14
            
          </div>
          <div ref={indicatorChartRef} className="w-full h-full" />
        </div>
          <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden" onMouseEnter={() => activeSourceChartRef.current = rsiChart || null} onTouchStart={() => activeSourceChartRef.current = rsiChart || null}>
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white">
            RSI 14
            
          </div>
          <div ref={rsiChartRef} className="w-full h-full" />
        </div>
      </div>
      <OrdersTable orders={executedOrders} />
    </main>
  );
}

export default function HomePage() {
  const { data, isLoading } = useBacktestData({
    symbol: SYMBOL,
    strategy: STRATEGY,
  });

  if (isLoading) {
    return 'loading...';
  }

  return (
    <HomePageInternal marketData={data.marketData} positions={data.positions} />
  );
}
