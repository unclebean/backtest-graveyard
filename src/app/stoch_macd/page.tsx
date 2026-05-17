'use client';


import { useCallback, useEffect, useRef, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { useStochChart } from '@/hooks/useStochChart';
import { CandlestickChartReplayWithPositions } from '@/components/CandlestickChartReplayWithPositions';
import { IChartApi } from 'lightweight-charts';
import { useMACDChart } from '@/hooks/useMACDChart';
import StrategyDetails from '@/components/StrategyDetails';
import { Position } from '@/types/chart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
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
  const macdIndicatorCharthRef = useRef<HTMLDivElement>(null);

  const [showOverlay, setShowOverlay] = useState(true);
  const [candles, setCandles] = useState([] as CandlestickData[]);
        const [isDone, setIsDone] = useState(false);

  const onFinish = useCallback(() => {
    setIsDone(true);
  }, []);

    const { stochChart } = useStochChart({
    candlesticks: candles,
    indicatorChartRef: indicatorCharthRef,
  });
  const { macdChart } = useMACDChart({
    candlesticks: candles,
    indicatorChartRef: macdIndicatorCharthRef,
  });

  const activeSourceChartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const charts = [stochChart, macdChart, candlestickChart].filter(Boolean) as IChartApi[];

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
  }, [stochChart, macdChart, candlestickChart]);

  if (showOverlay) {
    return (
      <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex gap-8 justify-center items-center flex-col-reverse">
        <StrategyStatsCard
          name="ETH/USDT"
          subTitle="Stoch MACD Strategy"
          symbol="ETH"
          strategy="stoch_macd"
          onStartAction={() => setShowOverlay(false)}
        />
      </main>
    );
  }

  return (
    <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {isDone && (
        <StrategyDetails name={'Stoch MACD Strategy Details'}>
          <div className="text-base space-y-1">
            <dl>
              <dt>Open Long</dt>
              <dd className="pl-2">
                {
                  'Stoch %D < 20 and %K < 20 when macd < 0 and macd > macd_signal'
                }
              </dd>
              <dt>Close Long</dt>
              <dd className="pl-2">{'macd <= macd_signal'}</dd>
            </dl>
            <dl className="border-t border-b border-white mb-2">
              <dt>Open Short</dt>
              <dd className="pl-2">
                {
                  'Stoch %D > 80 and %K > 80 when macd > 0 and macd < macd_signal'
                }
              </dd>
              <dt>Close Short</dt>
              <dd className="pl-2">{'macd >= macd_signal'}</dd>
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
        <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden" onMouseEnter={() => activeSourceChartRef.current = macdChart || null} onTouchStart={() => activeSourceChartRef.current = macdChart || null}>
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white">
            MACD 12 26 9
          </div>
          <div ref={macdIndicatorCharthRef} className="w-full h-full" />
        </div>
        <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden" onMouseEnter={() => activeSourceChartRef.current = stochChart || null} onTouchStart={() => activeSourceChartRef.current = stochChart || null}>
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white">
            STOCH 12 6
          </div>
          <div ref={indicatorCharthRef} className="w-full h-full" />
        </div>
      </div>
      <OrdersTable orders={executedOrders} />
    </main>
  );
}

export default function HomePage() {
  const { data, isLoading } = useBacktestData({
    symbol: 'ETH',
    strategy: 'stoch_macd',
  });
  if (isLoading) {
    return 'loading...';
  }

  return (
    <HomePageInternal marketData={data.marketData} positions={data.positions} />
  );
}
