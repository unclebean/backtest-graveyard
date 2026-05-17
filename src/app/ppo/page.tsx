'use client';

import { useEffect, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import { Position } from '@/types/chart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
import { useBacktestData } from '@/hooks/useBacktestData';
import StrategyStatsCard from '@/components/StrategyStatsCard';

import { CandlestickChartReplayWithPositions } from '@/components/CandlestickChartReplayWithPositions';

const SYMBOL = 'DOGE';
const STRATEGY = 'ppo cnn';
const TITLE = 'DOGE/USDT';
const DESC = 'DOGE/USDT';
const SUB_DESC = 'PPO CNN Strategy';

interface HomePageProps {
  marketData: CandlestickData[];
  positions: Position[];
}

function HomePageInternal({ marketData, positions }: Readonly<HomePageProps>) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [executedOrders, setExecutedOrders] = useState<OrderLog[]>([]);

  useEffect(() => {
    if (showOverlay) return;
  }, [marketData, positions, showOverlay]);

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
        <div className="flex-1 min-h-[400px]">
            <CandlestickChartReplayWithPositions
              onOrdersUpdate={setExecutedOrders}
              title={TITLE}
              initialBalance={10000}
              candlesticks={marketData}
              positions={positions}
            />
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
