import { useChartResize } from '@/hooks/useChartResize';
import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { MACD } from 'technicalindicators';
import { IndicatorChartProps } from '@/types/chart';

export const useMACDChart = ({
  candlesticks,
  indicatorChartRef,
  height = 150,
}: IndicatorChartProps) => {
  const [macdChart, setMacdChart] = useState<IChartApi>();
  useChartResize(macdChart, indicatorChartRef);
  const seriesRef = useRef<{
    macd: ReturnType<IChartApi['addSeries']>;
    signal: ReturnType<IChartApi['addSeries']>;
    histogram: ReturnType<IChartApi['addSeries']>;
  }>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!indicatorChartRef?.current || candlesticks.length === 0 || macdChart) return;
    const chart = createChart(indicatorChartRef.current, {
      height,
      layout: {
        background: { color: '#151924' },
        textColor: '#ccc',
        fontSize: 11,
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

    const histogramSeries = chart.addSeries(HistogramSeries, { priceLineVisible: false });
    const macdSeries = chart.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 1,
      priceLineVisible: false,
    });
    const signalSeries = chart.addSeries(LineSeries, {
      color: '#ff6d00',
      lineWidth: 1,
      priceLineVisible: false,
    });

    seriesRef.current = {
      macd: macdSeries,
      signal: signalSeries,
      histogram: histogramSeries,
    };

    setMacdChart(chart);
  }, [height, indicatorChartRef, candlesticks.length, macdChart]);

  useEffect(() => {
    return () => {
      if (macdChart) {
        macdChart.remove();
      }
    };
  }, [macdChart]);

  useEffect(() => {
    if (!macdChart || candlesticks.length === 0 || !seriesRef.current) return;

    const close = candlesticks.map((c) => c.close);

    const macdResult = MACD.calculate({
      values: close,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - macdResult.length;
    const macdLine = time.map((v, i) => {
      const offsetIndex = i < offset ? 0 : i - offset;
      const macd = macdResult[offsetIndex].MACD ?? 0;
      return {
        time: v,
        value: i < offset ? 0 : macd,
      };
    });

    const signalLine = time.map((v, i) => {
      const offsetIndex = i < offset ? 0 : i - offset;
      const signal = macdResult[offsetIndex].signal ?? 0;
      return {
        time: v,
        value: i < offset ? 0 : signal,
      };
    });

    const histogram = time.map((v, i) => {
      const histogramValue =
        i < offset ? 0 : (macdResult[i - offset].histogram ?? 0);
      return {
        time: v,
        value: histogramValue,
        color: histogramValue >= 0 ? '#26a69a' : '#ff5252',
      };
    });

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesRef.current.histogram?.update(histogram[histogram.length - 1] as any);
      seriesRef.current.macd?.update(macdLine[macdLine.length - 1]);
      seriesRef.current.signal?.update(signalLine[signalLine.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesRef.current.histogram?.setData(histogram as any);
      seriesRef.current.macd?.setData(macdLine);
      seriesRef.current.signal?.setData(signalLine);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesticks, macdChart]);

  return { macdChart };
};
