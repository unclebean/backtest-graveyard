'use client';

import PlaceOrderForm from '@/components/PlaceOrderForm';
import type { CandlestickData } from 'lightweight-charts';
import { useReplayData } from '@/hooks/useChartReplayData';
import { CandlestickChartReplay } from '@/components/CandlestickChartReplay';
import { IOrder } from '@/types/trade';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface HomePageProps {
  marketData: CandlestickData[];
}

function HomePageInternal({ marketData }: Readonly<HomePageProps>) {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const onNewOrder = (order: IOrder) => {
    setOrders([...orders, order]);
  };
  return (
    <main className="p-4 bg-black min-h-screen">
      <CandlestickChartReplay candlesticks={marketData} orders={orders} />
      <PlaceOrderForm onNewOrder={onNewOrder} />
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
