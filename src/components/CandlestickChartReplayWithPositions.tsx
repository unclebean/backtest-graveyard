import { useIsMobile } from '@/lib/useIsMobile';
import { useEffect, useRef, useState } from 'react';
import { useChartResize } from '@/hooks/useChartResize';
import {
  CandlestickData,
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi,
  SeriesMarker,
  Time,
} from 'lightweight-charts';
import { CandlestickReplayChartWithPositionsProps } from '@/types/chart';
import { Button } from '@/components/ui/button';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { OrderLog } from '@/components/OrdersTable';

export const CandlestickChartReplayWithPositions = ({
  title,
  candlesticks,
  positions,
  setChart,
  initialBalance,
  onFinish,
  onTick,
  onOrdersUpdate,
}: CandlestickReplayChartWithPositionsProps & { onOrdersUpdate?: (orders: OrderLog[]) => void }) => {
  const isMobile = useIsMobile();
  const candlestickChartRef = useRef<HTMLDivElement>(null);
  const [historyData, setHistoryData] = useState<CandlestickData[]>([]);
  const [newData, setNewData] = useState<CandlestickData[]>([]);
  const [seriesData, setSeriesData] =
    useState<ISeriesApi<'Candlestick'> | null>(null);
  const [, setActiveMarkers] = useState<SeriesMarker<Time>[]>([]);
  const [currentTickIndex, setCurrentTickIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersPluginRef = useRef<any>(null);
  const [candlestickChart, setCandlestickChart] = useState<IChartApi>();
  const [win, setWin] = useState(0);
  const [loss, setLoss] = useState(0);
  const [balance, setBalance] = useState(initialBalance);
  const [executedPositions, setExecutedPositions] = useState<OrderLog[]>([]);

  useEffect(() => {
    if (onOrdersUpdate) {
      onOrdersUpdate(executedPositions);
    }
  }, [executedPositions, onOrdersUpdate]);

  useEffect(() => {
    if (setChart && candlestickChart) {
      setChart(candlestickChart);
    }
  }, [candlestickChart, setChart]);

  useChartResize(candlestickChart, candlestickChartRef);

  useEffect(() => {
    if (!positions || positions.length === 0 || candlesticks.length === 0) {
      setHistoryData(candlesticks);
      setNewData([]);
      return;
    }

    const firstPositionTime = positions[0].time;
    let startIndex = candlesticks.findIndex(
      (c) => c.time === firstPositionTime,
    );
    if (startIndex === -1) {
      // Fallback: find the first candle that is >= firstPositionTime
      startIndex = candlesticks.findIndex((c) => (c.time as number) >= (firstPositionTime as number));
    }
    if (startIndex === -1) startIndex = 500; // fallback if still not found

    // Give 50 bars of history before the first trade for visual context
    startIndex = Math.max(0, startIndex - 50);

    console.log('startIndex', startIndex);
    setHistoryData(candlesticks.slice(0, startIndex));
    setNewData(candlesticks.slice(startIndex, candlesticks.length));

    if (onTick) {
      onTick(candlesticks.slice(0, startIndex));
    }
  }, [candlesticks, positions, onTick]);

  useEffect(() => {
    if (!candlestickChartRef.current) return;
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
        /*tickMarkFormatter: (time: Time) => {
          const date = new Date(Number(time) * 1000); // if using UNIX timestamp
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },*/
      },
    });

    const totalBars = historyData.length;
    chart.timeScale().setVisibleLogicalRange({
      from: totalBars - 50, // show last 50 bars
      to: totalBars,
    });

    const series = chart.addSeries(CandlestickSeries, { priceLineVisible: false });
    series.setData(historyData);
    markersPluginRef.current = createSeriesMarkers(series, []);
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

  // Force initial viewport to the start position AFTER indicators have loaded
  useEffect(() => {
    if (candlestickChart && historyData.length > 0) {
      const timer = setTimeout(() => {
        const lastTick = historyData[historyData.length - 1];
        const logicalIndex = candlesticks.findIndex((c) => c.time === lastTick.time);
        if (logicalIndex !== -1) {
          candlestickChart.timeScale().setVisibleLogicalRange({
            from: logicalIndex - 50,
            to: logicalIndex + 5,
          });
        }
      }, 100); // Give indicator hooks time to mount and add their data
      return () => clearTimeout(timer);
    }
  }, [candlestickChart, historyData, candlesticks]);

  useEffect(() => {
    if (isPlaying) {
      let runTimes = currentTickIndex;
      intervalRef.current = setInterval(() => {
        if (runTimes < newData.length && isPlaying) {
          const newTick = newData[runTimes];
          seriesData?.update(newTick);

          if (onTick) {
            onTick([...historyData, ...newData.slice(0, runTimes + 1)]);
          }

          const currentPositions = positions.filter((p) => p.time === newTick.time);
          if (currentPositions.length > 0 && seriesData) {
            setActiveMarkers((prev) => {
              const updatedMarkers = [...prev, ...(currentPositions as SeriesMarker<Time>[])];
              if (markersPluginRef.current) {
                markersPluginRef.current.setMarkers(updatedMarkers);
              }
              return updatedMarkers;
            });

            const newLogs: OrderLog[] = [];
            let newWin = win;
            let newLoss = loss;
            let newBalance = balance;

            currentPositions.forEach((position) => {
              const isClose = position.result !== undefined;
              const signal = position.entry_signal?.toLowerCase();
              const isSell = position.position === 'aboveBar';
              
              let actionText = '';
              if (signal === 'short') {
                actionText = isClose ? 'CLOSE SHORT' : 'OPEN SHORT';
              } else if (signal === 'long') {
                actionText = isClose ? 'CLOSE LONG' : 'OPEN LONG';
              } else {
                if (isSell && isClose) actionText = 'CLOSE LONG';
                else if (isSell && !isClose) actionText = 'OPEN SHORT';
                else if (!isSell && isClose) actionText = 'CLOSE SHORT';
                else if (!isSell && !isClose) actionText = 'OPEN LONG';
              }

              newLogs.push({
                time: position.time as number,
                action: actionText,
                side: isSell ? 'sell' : 'buy',
                pnl: position.result
              });

              if (position.result) {
                if (position.result > 0) newWin++;
                else newLoss++;
                newBalance += position.result;
              }
            });

            setExecutedPositions((prev) => [...prev, ...newLogs]);
            if (newWin !== win) setWin(newWin);
            if (newLoss !== loss) setLoss(newLoss);
            if (newBalance !== balance) setBalance(newBalance);
          }

          runTimes += 1;
          setCurrentTickIndex(runTimes);

          if (candlestickChart) {
            candlestickChart.timeScale().scrollToRealTime();
          }

          if (runTimes >= newData.length) {
            setIsPlaying(false);
            if (onFinish) onFinish();
          }
        }
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    balance,
    currentTickIndex,
    isPlaying,
    loss,
    newData,
    positions,
    seriesData,
    win,
    onFinish,
  ]);

  return (
    <div className="flex flex-col w-full h-full relative border border-white/10 rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#151924] border-b border-white/10 text-white px-4 py-2 z-10 gap-4 shrink-0 sm:h-[52px]">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full sm:w-auto">
          <h4 className="text-lg font-bold tracking-tight">{title}</h4>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-md text-green-400">
              <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-90">WIN</span>
              <span className="font-bold text-xs sm:text-sm leading-none">{win}</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-md text-red-400">
              <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-90">LOSS</span>
              <span className="font-bold text-xs sm:text-sm leading-none">{loss}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-0.5 rounded-md">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Balance</span>
              <span className="font-bold text-green-400 text-xs sm:text-sm leading-none">${balance.toFixed(2)}</span>
            </div>
          </div>
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
