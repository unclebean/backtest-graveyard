import { useEffect, useState } from 'react';
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  IChartApi,
  SeriesMarker,
  Time,
} from 'lightweight-charts';
import { CandlestickChartProps } from '@/types/chart';
import { useIsMobile } from '@/lib/useIsMobile';

export const useCandlestickChart = ({
  candlesticks,
  candlestickChartRef,
  positions,
  updateWin,
  updateLoss,
  onFinish,
  height = 400,
  updateTotalProfit,
}: CandlestickChartProps) => {
  const isMobile = useIsMobile();
  const [candlestickChart, setCandlestickChart] = useState<IChartApi>();
  useEffect(() => {
    if (!candlestickChartRef.current || candlesticks.length === 0) return;
    const chart = createChart(candlestickChartRef.current, {
      height,
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

    const totalBars = candlesticks.length;
    chart.timeScale().setVisibleLogicalRange({
      from: totalBars - 50, // show last 50 bars
      to: totalBars,
    });

    const series = chart.addSeries(CandlestickSeries, { priceLineVisible: false });
    series.setData(candlesticks);
    const markersPlugin = createSeriesMarkers(series, []);
    chart.timeScale().applyOptions({
      minBarSpacing: 3,
      fixLeftEdge: true,
      fixRightEdge: false,
    });

    const sortedMarkers = [...positions].sort((a, b) => a.time - b.time);

    let i = 0;
    let totalWin = 0;
    let totalLoss = 0;
    let totalProfit = 0;

    const scrollToNextMarker = () => {
      if (i >= sortedMarkers.length) {
        onFinish();
        return;
      }

      const currentTime = sortedMarkers[i].time;

      // Define visible range: 50 bars before the marker
      const barWidth = isMobile ? 1440 : 5000; // if using 5min bars, 5×60
      const from = (currentTime - barWidth * 50) as Time;
      const to = (currentTime + barWidth) as Time;

      chart.timeScale().setVisibleRange({ from, to });
      markersPlugin.setMarkers([sortedMarkers[i]] as SeriesMarker<Time>[]);

      const result = sortedMarkers[i].result;

      if (result) {
        if (result > 0) {
          updateWin(++totalWin);
        } else {
          updateLoss(++totalLoss);
        }
        totalProfit += result;
        if (updateTotalProfit) {
          updateTotalProfit(totalProfit);
        }
      }

      i++;
      setTimeout(scrollToNextMarker, 1000); // scroll every 1.5s
    };

    scrollToNextMarker();

    setCandlestickChart(chart);
    return () => {
      chart.remove();
    };
  }, [
    candlestickChartRef,
    candlesticks,
    height,
    isMobile,
    onFinish,
    positions,
    updateLoss,
    updateTotalProfit,
    updateWin,
  ]);

  return { candlestickChart };
};
