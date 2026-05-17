import { useIsMobile } from '@/lib/useIsMobile';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CandlestickData,
  CandlestickSeries,
  createChart,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import { CandlestickReplayChartProps } from '@/types/chart';
import { useChartResize } from '@/hooks/useChartResize';
import { Button } from '@/components/ui/button';
import { IOrder } from '@/types/trade';
import { OrderDetailsView } from '@/components/OrderDetailsView';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { OrderLog } from '@/components/OrdersTable';

export const CandlestickChartReplay = ({
  title = 'ETH/USDT',
  candlesticks,
  orders,
  setChart,
  onTick,
  onOrdersUpdate,
}: CandlestickReplayChartProps & { onTick?: (candles: CandlestickData[]) => void; onOrdersUpdate?: (orders: OrderLog[]) => void }) => {
  const isMobile = useIsMobile();
  const candlestickChartRef = useRef<HTMLDivElement>(null);
  const [historyData, setHistoryData] = useState<CandlestickData[]>([]);
  const [newData, setNewData] = useState<CandlestickData[]>([]);
  const [seriesData, setSeriesData] =
    useState<ISeriesApi<'Candlestick'> | null>(null);

  const [currentTickIndex, setCurrentTickIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  const activePriceLinesRef = useRef<IPriceLine[]>([]);
  const [candlestickChart, setCandlestickChart] = useState<IChartApi>();
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);

  useEffect(() => {
    if (onOrdersUpdate) {
      onOrdersUpdate(orderLogs);
    }
  }, [orderLogs, onOrdersUpdate]);

  useEffect(() => {
    if (setChart && candlestickChart) {
      setChart(candlestickChart);
    }
  }, [candlestickChart, setChart]);

  useChartResize(candlestickChart, candlestickChartRef);

  useEffect(() => {
    const startIndex = 500;
    const initialHistory = candlesticks.slice(0, candlesticks.length - startIndex);
    setHistoryData(initialHistory);
    setNewData(
      candlesticks.slice(candlesticks.length - startIndex, candlesticks.length),
    );
    if (onTick) {
      onTick(initialHistory);
    }
  }, [candlesticks, onTick]);

  useEffect(() => {
    if (!candlestickChartRef.current || historyData.length === 0) return;
    const chart = createChart(candlestickChartRef.current, {
      height: 450,
      layout: {
        background: { color: '#151924' },
        textColor: '#ccc',
        fontSize: 9,
      },
      rightPriceScale: {
        borderVisible: true,
        scaleMargins: {
          top: 0.2,
          bottom: 0.1,
        },
        minimumWidth: 60,
      },
      grid: {
        vertLines: { color: '#333' },
        horzLines: { color: '#333' },
      },
      timeScale: {
        timeVisible: true,
      },
    });

    const totalBars = historyData.length;
    chart.timeScale().setVisibleLogicalRange({
      from: totalBars - 50, // show last 50 bars
      to: totalBars,
    });

    const series = chart.addSeries(CandlestickSeries, { priceLineVisible: false });
    series.setData(historyData);
    chart.timeScale().applyOptions({
      minBarSpacing: 3,
      fixLeftEdge: true,
      fixRightEdge: false,
    });

    setSeriesData(series);
    setCandlestickChart(chart);

    return () => {
      chart.remove();
    };
  }, [historyData, isMobile]);

  const dealLimitOrder = useCallback(
    (newTick: CandlestickData<Time>) => {
      if (
        currentOrder &&
        currentOrder.side === 'buy' &&
        currentOrder.price >= newTick.low &&
        currentOrder.type === 'limit' &&
        currentOrder.status === 'submitted'
      ) {
        setCurrentOrder({ ...currentOrder, status: 'filled' });
        setOrderLogs((prev) => [...prev, { time: newTick.time as number, action: 'FILLED Limit', side: currentOrder.side, price: currentOrder.price }]);
      }
      if (
        currentOrder &&
        currentOrder.side === 'sell' &&
        currentOrder.price <= newTick.high &&
        currentOrder.type === 'limit' &&
        currentOrder.status === 'submitted'
      ) {
        setCurrentOrder({ ...currentOrder, status: 'filled' });
        setOrderLogs((prev) => [...prev, { time: newTick.time as number, action: 'FILLED Limit', side: currentOrder.side, price: currentOrder.price }]);
      }
    },
    [currentOrder],
  );

  const dealStopOrder = useCallback(
    (newTick: CandlestickData<Time>) => {
      if (
        currentOrder &&
        currentOrder.side === 'buy' &&
        currentOrder.price >= newTick.open &&
        currentOrder.price <= newTick.high &&
        currentOrder.type === 'stop' &&
        currentOrder.status === 'submitted'
      ) {
        setCurrentOrder({ ...currentOrder, status: 'filled' });
        setOrderLogs((prev) => [...prev, { time: newTick.time as number, action: 'FILLED Stop', side: currentOrder.side, price: currentOrder.price }]);
      }
      if (
        currentOrder &&
        currentOrder.side === 'sell' &&
        currentOrder.price <= newTick.open &&
        currentOrder.price >= newTick.low &&
        currentOrder.type === 'stop' &&
        currentOrder.status === 'submitted'
      ) {
        setCurrentOrder({ ...currentOrder, status: 'filled' });
        setOrderLogs((prev) => [...prev, { time: newTick.time as number, action: 'FILLED Stop', side: currentOrder.side, price: currentOrder.price }]);
      }
    },
    [currentOrder],
  );

  const removeClosedOrder = useCallback(() => {
    activePriceLinesRef.current.forEach((pl) => {
      try {
        seriesData?.removePriceLine(pl);
      } catch {
        // Ignore errors if already removed
      }
    });
    activePriceLinesRef.current = [];
  }, [seriesData]);

  const dealLossAndProfit = useCallback(
    (newTick: CandlestickData<Time>) => {
      if (!currentOrder) {
        return;
      }
      const { stopLoss, takeProfit, side } = currentOrder;
      if (
        takeProfit &&
        ((side === 'buy' && takeProfit <= newTick.high) ||
          (side === 'sell' && takeProfit >= newTick.low))
      ) {
        setCurrentOrder({
          ...currentOrder,
          status: 'closed take profit',
          orderClosePrice: takeProfit,
        });
        const pnl = currentOrder.side === 'buy' ? takeProfit - currentOrder.price : currentOrder.price - takeProfit;
        setOrderLogs((prev) => [...prev, { time: newTick.time as number, action: 'TAKE PROFIT', side: currentOrder.side, price: takeProfit, pnl }]);
        removeClosedOrder();
      }
      if (
        stopLoss &&
        ((side === 'buy' && stopLoss >= newTick.low) ||
          (side === 'sell' && stopLoss <= newTick.high))
      ) {
        setCurrentOrder({
          ...currentOrder,
          status: 'closed stop loss',
          orderClosePrice: stopLoss,
        });
        const pnl = currentOrder.side === 'buy' ? stopLoss - currentOrder.price : currentOrder.price - stopLoss;
        setOrderLogs((prev) => [...prev, { time: newTick.time as number, action: 'STOP LOSS', side: currentOrder.side, price: stopLoss, pnl }]);
        removeClosedOrder();
      }
    },
    [currentOrder, removeClosedOrder],
  );

  useEffect(() => {
    if (isPlaying) {
      let runTimes = currentTickIndex;
      intervalRef.current = setInterval(() => {
        if (runTimes < newData.length && isPlaying) {
          const newTick = newData[runTimes];
          setCurrentPrice(newTick.close);
          seriesData?.update(newTick);
          runTimes += 1;
          setCurrentTickIndex(runTimes);

          if (candlestickChart) {
            candlestickChart.timeScale().scrollToRealTime();
          }

          if (onTick) {
            onTick([...historyData, ...newData.slice(0, runTimes + 1)]);
          }

          dealLimitOrder(newTick);
          dealStopOrder(newTick);
          dealLossAndProfit(newTick);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    currentOrder,
    currentTickIndex,
    dealLimitOrder,
    dealLossAndProfit,
    dealStopOrder,
    isPlaying,
    newData,
    seriesData,
  ]);

  useEffect(() => {
    if (seriesData !== null) {
      activePriceLinesRef.current.forEach((pl) => {
        try {
          seriesData.removePriceLine(pl);
        } catch {
          // Ignore
        }
      });
      const priceLines: IPriceLine[] = [];
      orders.forEach((order) => {
        const lastBar = seriesData.data().at(-1) as CandlestickData;
        if (order.type === 'market') {
          const orderPrice = lastBar.close * 1.0005;
          const pl = seriesData.createPriceLine({
            price: orderPrice,
            color: 'rgb(11,117,239)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'Market Order - Long',
          });
          priceLines.push(pl);
          setCurrentOrder({ ...order, price: orderPrice, status: 'filled' });
          setOrderLogs((prev) => [...prev, { time: lastBar.time as number, action: 'FILLED Market', side: order.side, price: orderPrice }]);
        } else if (order.type === 'limit' || order.type === 'stop') {
          const orderTitle = order.type === 'limit' ? 'Limit' : 'Stop';
          const pl = seriesData.createPriceLine({
            price: order.price,
            color: 'rgb(11,117,239)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `${orderTitle} Order - Short(${order.price})`,
          });
          priceLines.push(pl);
          setCurrentOrder({ ...order, status: 'submitted' });
        }

        if (order.stopLoss) {
          const pl = seriesData.createPriceLine({
            price: order.stopLoss,
            color: 'rgb(250,30,181)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Stop Loss (${order.stopLoss})`,
          });
          priceLines.push(pl);
        }

        if (order.takeProfit) {
          const pl = seriesData.createPriceLine({
            price: order.takeProfit,
            color: 'rgb(250,30,181)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Take Profit (${order.takeProfit})`,
          });
          priceLines.push(pl);
        }
      });

      activePriceLinesRef.current = priceLines;

      return () => {
        priceLines.forEach((pl) => {
          try {
            seriesData.removePriceLine(pl);
          } catch {
            // Ignore
          }
        });
      };
    }
  }, [orders, seriesData]);

  return (
    <div className="flex flex-col w-full h-full relative border border-white/10 rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#151924] border-b border-white/10 text-white px-4 py-2 z-10 gap-4 shrink-0 sm:h-[52px]">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full sm:w-auto">
          <h4 className="text-lg font-bold tracking-tight">{title}</h4>
          {currentOrder && (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-0.5 rounded-lg w-full md:w-auto">
              <OrderDetailsView
                order={currentOrder}
                currentPrice={currentPrice}
              />
            </div>
          )}
        </div>
        <div className="w-full sm:w-auto flex justify-end">
          {!isPlaying ? (
            <Button size="sm" onClick={() => setIsPlaying(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200">
              <PlayCircle className="w-4 h-4" /> Start Replay
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setIsPlaying(false)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white transition-colors duration-200">
              <PauseCircle className="w-4 h-4" /> Pause Replay
            </Button>
          )}
        </div>
      </div>
      <div ref={candlestickChartRef} className="w-full flex-1 min-h-[400px]" />
    </div>
  );
};
