'use client';


import { useCallback, useEffect, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { CandlestickChartReplayWithPositions } from '@/components/CandlestickChartReplayWithPositions';
import { IChartApi } from 'lightweight-charts';
import StrategyDetails from '@/components/StrategyDetails';
import { Position } from '@/types/chart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
import { useHeikinAshiData } from '@/hooks/useHeikinAshiData';
import { useSupperTrend } from '@/hooks/useSupperTrend';
import { useBacktestData } from '@/hooks/useBacktestData';
import StrategyStatsCard from '@/components/StrategyStatsCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface HomePageProps {
  marketData: CandlestickData[];
  positions: Position[];
}

function HomePageInternal({ marketData, positions }: Readonly<HomePageProps>) {
  const [candlestickChart, setChart] = useState<IChartApi>();
  const [executedOrders, setExecutedOrders] = useState<OrderLog[]>([]);

  const [showOverlay, setShowOverlay] = useState(true);
  const [candles, setCandles] = useState([] as CandlestickData[]);
        const [isDone, setIsDone] = useState(false);

  const onFinish = useCallback(() => {
    setIsDone(true);
  }, []);

  useHeikinAshiData({ candlesticks: candles });

  
  useSupperTrend({
    candlesChart: candlestickChart,
    candlesticks: candles,
  });

  useEffect(() => {
    if (showOverlay) return;
    setCandles(marketData);  }, [candlestickChart, marketData, positions, showOverlay]);

  if (showOverlay) {
    return (
      <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex gap-8 justify-center items-center flex-col-reverse">
        <StrategyStatsCard
          name="ETH/USDT"
          subTitle="Heikin Ashi Supper Trend Strategy"
          symbol="ETH"
          strategy="heikin_ashi_supper_trend"
          onStartAction={() => setShowOverlay(false)}
        />
      </main>
    );
  }

  return (
    <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {isDone && (
        <StrategyDetails name={'Heikin Ashi Supper Trend Strategy Details'}>
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
      </div>
      <OrdersTable orders={executedOrders} />
    </main>
  );
}

export default function HomePage() {
  const { data, isLoading } = useBacktestData({
    symbol: 'ETH',
    strategy: 'heikin_ashi_supper_trend',
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <HomePageInternal marketData={data.marketData} positions={data.positions} />
  );
}
