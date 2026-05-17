'use client';


import { useCallback, useEffect, useRef, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { CandlestickChartReplayWithPositions } from '@/components/CandlestickChartReplayWithPositions';
import { IChartApi } from 'lightweight-charts';
import StrategyDetails from '@/components/StrategyDetails';
import { Position } from '@/types/chart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
import { useBollingerBands } from '@/hooks/useBollingerBands';
import { useAdxChart } from '@/hooks/useAdxChart';
import { useRsiChart } from '@/hooks/useRsiChart';
import { useBacktestData } from '@/hooks/useBacktestData';
import StrategyStatsCard from '@/components/StrategyStatsCard';

interface HomePageProps {
  marketData: CandlestickData[];
  positions: Position[];
}

function HomePageInternal({ marketData, positions }: Readonly<HomePageProps>) {
  const [candlestickChart, setChart] = useState<IChartApi>();
  const [executedOrders, setExecutedOrders] = useState<OrderLog[]>([]);
  const indicatorCharthRef = useRef<HTMLDivElement>(null);
  const rsiCharthRef = useRef<HTMLDivElement>(null);

  const [showOverlay, setShowOverlay] = useState(true);
  const [candles, setCandles] = useState([] as CandlestickData[]);
        const [isDone, setIsDone] = useState(false);

  const onFinish = useCallback(() => {
    setIsDone(true);
  }, []);

  
  useBollingerBands({
    candlesChart: candlestickChart,
    candlesticks: candles,
  });

  const { adxChart } = useAdxChart({
    candlesticks: candles,
    indicatorChartRef: indicatorCharthRef,
  });

  const { rsiChart } = useRsiChart({
    candlesticks: candles,
    indicatorChartRef: rsiCharthRef,
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

  if (showOverlay) {
    return (
      <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex gap-8 justify-center items-center flex-col-reverse">
        <StrategyStatsCard
          name="ETH/USDT"
          subTitle="Bollinger Bands ADX RSI Strategy"
          symbol="ETH"
          strategy="bb_adx_rsi"
          onStartAction={() => setShowOverlay(false)}
        />
      </main>
    );
  }

  return (
    <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {isDone && (
        <StrategyDetails name={'Bollinger Bands ADX RSI Strategy Details'}>
          <div className="text-base space-y-1">
            <dl>
              <dt>Open Long</dt>
              <dd className="pl-2">
                {'When ADX < 30 and RSI from less than 30 becomes greater than 30(RSI cross up 30),\n' +
                  'meanwhile BB Lower Line cross down Close Price'}
              </dd>
              <dt>Close Long</dt>
              <dd className="pl-2">
                {'Close Price >= BB Upper Line and RSI >= 70'}
              </dd>
            </dl>
            <dl className="border-t border-b border-white mb-2">
              <dt>Open Short</dt>
              <dd className="pl-2">
                {'When ADX < 30 and RSI from greater than 70 becomes less than 70(RSI cross down 70),\n' +
                  'meanwhile BB Upper Line cross up Close Price'}
              </dd>
              <dt>Close Short</dt>
              <dd className="pl-2">
                {'Close Price  <= BB Lower Line and RSI <= 30'}
              </dd>
            </dl>
            <i>
              🧠 Stop Loss & Take Profit: 2x ATR for Stop Loss, 3x ATR for Take
              Profit
            </i>
          </div>
        </StrategyDetails>
      )}
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
          <div ref={indicatorCharthRef} className="w-full h-full" />
        </div>
          <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden" onMouseEnter={() => activeSourceChartRef.current = rsiChart || null} onTouchStart={() => activeSourceChartRef.current = rsiChart || null}>
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white">
            RSI 5
            
          </div>
          <div ref={rsiCharthRef} className="w-full h-full" />
        </div>
      </div>
      <OrdersTable orders={executedOrders} />
    </main>
  );
}

export default function HomePage() {
  const { data, isLoading } = useBacktestData({
    symbol: 'ETH',
    strategy: 'bb_adx_rsi',
  });

  if (isLoading) {
    return 'loading...';
  }

  return (
    <HomePageInternal marketData={data.marketData} positions={data.positions} />
  );
}
