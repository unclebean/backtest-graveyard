'use client';

import type { CandlestickData, IChartApi } from 'lightweight-charts';
import { useReplayData } from '@/hooks/useChartReplayData';
import { CandlestickChartReplay } from '@/components/CandlestickChartReplay';
import { useRef, useState } from 'react';
import { Square } from 'lucide-react';
import { useMACDChart } from '@/hooks/useMACDChart';
import { OrderLog, OrdersTable } from '@/components/OrdersTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useChartSync } from '@/hooks/useChartSync';

interface HomePageProps {
  marketData: CandlestickData[];
}

function HomePageInternal({ marketData }: Readonly<HomePageProps>) {
  const [chart, setChart] = useState<IChartApi>();
  const [executedOrders, setExecutedOrders] = useState<OrderLog[]>([]);
  const indicatorChartRef = useRef<HTMLDivElement>(null);
  const mainChartContainerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState([] as CandlestickData[]);

  const { macdChart } = useMACDChart({
    candlesticks: candles,
    indicatorChartRef: indicatorChartRef,
    height: 300,
  });

  useChartSync([chart, macdChart], [mainChartContainerRef, indicatorChartRef]);

  return (
    <main className="p-4 bg-black min-h-[calc(100vh-56px)] flex flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        <div ref={mainChartContainerRef} className="flex-1 min-h-[400px]">
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
                <span className="text">Signal</span>
                <Square size={16} color={'black'} className="bg-[#ff6d00]" />
              </div>
              <div className="flex items-center justify-between flex-row gap-1">
                <span className="text">MACD</span>
                <Square size={16} color={'black'} className="bg-[#2962ff]" />
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
    return <LoadingSpinner />;
  }

  return <HomePageInternal marketData={data.marketData} />;
}
