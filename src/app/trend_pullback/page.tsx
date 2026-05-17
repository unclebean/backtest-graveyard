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

  useEffect(() => {
    let isSyncing = false;
    const charts = [adxChart, rsiChart, candlestickChart].filter(Boolean);

    const handlers = charts.map((sourceChart) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (range: any) => {
        if (!range || isSyncing) return;
        isSyncing = true;
        charts.forEach((targetChart) => {
          if (targetChart !== sourceChart) {
            targetChart!.timeScale().setVisibleLogicalRange(range);
          }
        });
        isSyncing = false;
      };
      sourceChart!.timeScale().subscribeVisibleLogicalRangeChange(handler);
      return { chart: sourceChart, handler };
    });

    return () => {
      handlers.forEach(({ chart, handler }) => {
        chart!.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
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
        <div className="flex-1 min-h-[400px]">
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
        <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden">
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white">
            ADX 14
            
          </div>
          <div ref={indicatorChartRef} className="w-full h-full" />
        </div>
          <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden">
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
