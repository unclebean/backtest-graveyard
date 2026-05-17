'use client';


import { useCallback, useEffect, useRef, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { CandlestickChartReplayWithPositions } from '@/components/CandlestickChartReplayWithPositions';
import { IChartApi } from 'lightweight-charts';
import StrategyDetails from '@/components/StrategyDetails';
import { Position } from '@/types/chart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
import { useCciChart } from '@/hooks/useCciChart';
import { useEma } from '@/hooks/useEma';
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

  const [showOverlay, setShowOverlay] = useState(true);
  const [candles, setCandles] = useState([] as CandlestickData[]);
        const [isDone, setIsDone] = useState(false);

  const onFinish = useCallback(() => {
    setIsDone(true);
  }, []);

  
  useEma({
    candlesChart: candlestickChart,
    candlesticks: candles,
    period: 10,
  });

  useEma({
    candlesChart: candlestickChart,
    candlesticks: candles,
    period: 30,
    color: '#2962ff',
  });

  const { cciChart } = useCciChart({
    candlesticks: candles,
    indicatorChartRef: indicatorCharthRef,
  });

  useEffect(() => {
    let isSyncing = false;
    const charts = [cciChart, candlestickChart].filter(Boolean);

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
  }, [cciChart, candlestickChart]);

  if (showOverlay) {
    return (
      <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex gap-8 justify-center items-center flex-col-reverse">
        <StrategyStatsCard
          name="DOGE/USDT"
          subTitle="CCI EMA Strategy"
          symbol="DOGE"
          strategy="cci_ema"
          onStartAction={() => setShowOverlay(false)}
        />
      </main>
    );
  }

  return (
    <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {isDone && (
        <StrategyDetails name={'CCI EMA Strategy Details'}>
          <div className="text-base space-y-1">
            <dl>
              <dt>Open Long</dt>
              <dd className="pl-2">
                {
                  'EMA10 > EMA30 and Close Price > EMA30 when CCI 7 cross up 0 line'
                }
              </dd>
              <dt>Close Long</dt>
              <dd className="pl-2">{'CCI 7 > 150'}</dd>
            </dl>
            <dl className="border-t border-b border-white mb-2">
              <dt>Open Short</dt>
              <dd className="pl-2">
                {
                  'EMA10 < EMA30 and Close Price < EMA30 when CCI 7 cross down 0 line'
                }
              </dd>
              <dt>Close Short</dt>
              <dd className="pl-2">{'CCI 7 < -150'}</dd>
            </dl>
            <i>
              🧠 Stop Loss & Take Profit: 2x ATR for Stop Loss, 3x ATR for Take
              Profit
            </i>
          </div>
        </StrategyDetails>
      )}
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
            CCI 7
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
    symbol: 'DOGE',
    strategy: 'cci_ema',
  });

  if (isLoading) {
    return 'loading...';
  }

  return (
    <HomePageInternal marketData={data.marketData} positions={data.positions} />
  );
}
