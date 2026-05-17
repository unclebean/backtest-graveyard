'use client';

import { useRef, useState } from 'react';
import type { CandlestickData, IChartApi } from 'lightweight-charts';
import { Position } from '@/types/chart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
import { useBacktestData } from '@/hooks/useBacktestData';
import StrategyStatsCard from '@/components/StrategyStatsCard';

import { useAdxChart } from '@/hooks/useAdxChart';
import { CandlestickChartReplayWithPositions } from '@/components/CandlestickChartReplayWithPositions';

import { useChartSync } from '@/hooks/useChartSync';

const SYMBOL = 'DOGE';
const STRATEGY = 'adx_fib_pullback';
const TITLE = 'DOGE/USDT';
const DESC = 'DOGE/USDT';
const SUB_DESC = 'Adx Fib Pullback Strategy';

interface HomePageProps {
  marketData: CandlestickData[];
  positions: Position[];
}

function HomePageInternal({ marketData, positions }: Readonly<HomePageProps>) {
  const [chart, setChart] = useState<IChartApi>();
  const [executedOrders, setExecutedOrders] = useState<OrderLog[]>([]);
  const indicatorChartRef = useRef<HTMLDivElement>(null);
  const mainChartContainerRef = useRef<HTMLDivElement>(null);

  const [showOverlay, setShowOverlay] = useState(true);
  const [candles, setCandles] = useState([] as CandlestickData[]);

  const { adxChart } = useAdxChart({
    candlesticks: candles,
    indicatorChartRef: indicatorChartRef,
    height: 300,
  });

  useChartSync([chart, adxChart], [mainChartContainerRef, indicatorChartRef]);

  if (showOverlay) {
    return (
      <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex gap-8 justify-center items-center flex-col-reverse">
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
        <div ref={mainChartContainerRef} className="flex-1 min-h-[400px]">
            <CandlestickChartReplayWithPositions
              onOrdersUpdate={setExecutedOrders}
              title={TITLE}
              initialBalance={10000}
              candlesticks={marketData}
              positions={positions}
              setChart={setChart}
              onTick={setCandles}
            />
          </div>
          <div className="relative h-[150px] shrink-0 border border-white/10 rounded-lg overflow-hidden">
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white">
            ADX 14
            
          </div>
          <div ref={indicatorChartRef} className="w-full h-full" />
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
