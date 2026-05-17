import { useChartResize } from '@/hooks/useChartResize';
import {
  CandlestickData,
  createChart,
  IChartApi,
  LineSeries,
} from 'lightweight-charts';
import { useHeikinAshiData } from '@/hooks/useHeikinAshiData';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { ISeriesApi } from 'lightweight-charts';

function rollingAverage(arr: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < window - 1) {
      result.push(NaN); // not enough data
    } else {
      const sum = arr
        .slice(i - window + 1, i + 1)
        .reduce((a, b) => a + Math.abs(b), 0);
      result.push(sum / window);
    }
  }
  return result;
}

export const useHeikinAshiMomentumChart = (
  candlesticks: CandlestickData[],
  indicatorChartRef: RefObject<HTMLDivElement | null>,
  rolling: number = 7,
  holderDev: number = 3,
) => {
  const shortHa = useHeikinAshiData({ candlesticks: candlesticks });
  const [haMomChart, setHaMomChart] = useState<IChartApi>();
  useChartResize(haMomChart, indicatorChartRef);

  const { threshold, shortVolatility } = useMemo(() => {
    const longVolatility = candlesticks.map((d) => (d.high - d.low) / d.high);
    const avgDv = rollingAverage(longVolatility, rolling);
    const threshold = avgDv.map((v) => v / holderDev);

    const shortVolatility = shortHa.map((d) => (d.close - d.open) / d.close);

    return { threshold, shortVolatility };
  }, [holderDev, candlesticks, rolling, shortHa]);

  const seriesRef = useRef<{
    threshold: ISeriesApi<"Line"> | undefined;
    shortVolatility: ISeriesApi<"Line"> | undefined;
  }>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!indicatorChartRef?.current || candlesticks.length === 0 || haMomChart) return;
    const chart = createChart(indicatorChartRef.current, {
      height: 150,
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
        shiftVisibleRangeOnNewBar: false,
      },
    });

    const thresholdSeries = chart.addSeries(LineSeries, {
      color: 'red',
      lineWidth: 2,
      priceLineVisible: false,
    });

    const shortVolatilitySeries = chart.addSeries(LineSeries, {
      color: 'green',
      lineWidth: 2,
      priceLineVisible: false,
    });

    seriesRef.current = {
      threshold: thresholdSeries,
      shortVolatility: shortVolatilitySeries,
    };

    setHaMomChart(chart);
  }, [indicatorChartRef, candlesticks.length, haMomChart]);

  useEffect(() => {
    return () => {
      if (haMomChart) {
        haMomChart.remove();
      }
    };
  }, [haMomChart]);

  useEffect(() => {
    if (!haMomChart || candlesticks.length === 0 || !seriesRef.current) return;

    const time = candlesticks.map((c) => c.time);

    const thresholdWithTime = time.map((v, i) => ({
      time: v,
      value: isNaN(threshold[i]) ? 0 : threshold[i] * 1000,
    }));

    const shortVolatilityWithTime = time.map((v, i) => ({
      time: v,
      value: isNaN(shortVolatility[i]) ? 0 : shortVolatility[i] * 1000,
    }));

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.threshold?.update(thresholdWithTime[thresholdWithTime.length - 1]);
      seriesRef.current.shortVolatility?.update(shortVolatilityWithTime[shortVolatilityWithTime.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.threshold?.setData(thresholdWithTime);
      seriesRef.current.shortVolatility?.setData(shortVolatilityWithTime);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesticks, haMomChart, shortVolatility, threshold]);

  return { haMomChart };
};
