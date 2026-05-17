'use client';

import type { CandlestickData, IChartApi } from 'lightweight-charts';
import { useReplayData } from '@/hooks/useChartReplayData';
import { CandlestickChartReplay } from '@/components/CandlestickChartReplay';
import { useEffect, useRef, useState } from 'react';
import { useAdxChart } from '@/hooks/useAdxChart';
import { Square } from 'lucide-react';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';

interface HomePageProps {
  marketData: CandlestickData[];
}

function HomePageInternal({ marketData }: Readonly<HomePageProps>) {
  const [chart, setChart] = useState<IChartApi>();
  const [executedOrders, setExecutedOrders] = useState<OrderLog[]>([]);
  const indicatorChartRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState([] as CandlestickData[]);

  const { adxChart } = useAdxChart({
    candlesticks: candles,
    indicatorChartRef: indicatorChartRef,
    height: 300,
  });

  useEffect(() => {
    let isSyncing = false;
    const charts = [chart, adxChart].filter(Boolean);

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
  }, [adxChart, chart]);

  return (
    <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        <div className="flex-1 min-h-[400px]">
          <CandlestickChartReplay
              onOrdersUpdate={setExecutedOrders}
            candlesticks={marketData}
            orders={[]}
            setChart={setChart}
            onTick={setCandles}
          />
        </div>
        <div className="relative h-[300px] shrink-0 border border-white/10 rounded-lg overflow-hidden">
          <div className="absolute z-10 top-2.5 left-2 bg-black/80 p-1 rounded text-sm text-white flex gap-1">
            <div className="flex items-center justify-between text-sm gap-1">
              <div className="flex items-center justify-between flex-row gap-1">
                <span className="text">ADX 14</span>
                <Square size={16} color={'black'} className="bg-[#f50057]" />
              </div>
              <div className="flex items-center justify-between flex-row gap-1">
                <span className="text">DI+</span>
                <Square size={16} color={'black'} className="bg-[#2962ff]" />
              </div>
              <div className="flex items-center justify-between flex-row gap-1">
                <span className="text">DI-</span>
                <Square size={16} color={'black'} className="bg-[#ff6d00]" />
              </div>
            </div>
          </div>
          <div ref={indicatorChartRef} className="w-full h-full" />
        </div>
      </div>
      <OrdersTable orders={executedOrders} />
    </main>
  );
}

export default function HomePage() {
  const { data, isLoading } = useReplayData({
    symbol: 'ETH',
    strategy: '',
  });
  if (isLoading) {
    return 'loading...';
  }

  return <HomePageInternal marketData={data.marketData} />;
}
