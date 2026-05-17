import { useChartResize } from '@/hooks/useChartResize';
import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { Stochastic } from 'technicalindicators';
import { IndicatorChartProps } from '@/types/chart';

export const useStochChart = ({
  candlesticks,
  indicatorChartRef,
}: IndicatorChartProps) => {
  const [stochChart, setStochChart] = useState<IChartApi>();
  useChartResize(stochChart, indicatorChartRef);
  const seriesRef = useRef<{
    k: ISeriesApi<"Line"> | undefined;
    d: ISeriesApi<"Line"> | undefined;
  }>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!indicatorChartRef?.current || candlesticks.length === 0 || stochChart) return;
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

    const kSeries = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 1,
      priceLineVisible: false,
    });

    const dSeries = chart.addSeries(LineSeries, {
      color: '#e7cf59',
      lineWidth: 1,
      priceLineVisible: false,
    });

    dSeries.createPriceLine({
      price: 80,
      color: '#888',
      lineWidth: 1,
      lineStyle: 1, // 0 = solid, 1 = dotted, 2 = dashed
      axisLabelVisible: true,
    });

    dSeries.createPriceLine({
      price: 20,
      color: '#888',
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
    });

    seriesRef.current = {
      k: kSeries,
      d: dSeries,
    };

    setStochChart(chart);
  }, [indicatorChartRef, candlesticks.length, stochChart]);

  useEffect(() => {
    return () => {
      if (stochChart) {
        stochChart.remove();
      }
    };
  }, [stochChart]);

  useEffect(() => {
    if (!stochChart || candlesticks.length === 0 || !seriesRef.current) return;

    const period = 14; // %k period
    const signalPeriod = 6; // %d period
    const result = Stochastic.calculate({
      high: candlesticks.map((c) => c.high),
      low: candlesticks.map((c) => c.low),
      close: candlesticks.map((c) => c.close),
      period,
      signalPeriod,
    });
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - result.length;
    const stochK = time.map((v, i) => ({
      time: v,
      value: i < offset ? 0 : result[i - offset].k,
    }));
    const stochD = time.map((v, i) => ({
      time: v,
      value: i < offset ? 0 : result[i - offset].d,
    }));

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.k?.update(stochK[stochK.length - 1]);
      seriesRef.current.d?.update(stochD[stochD.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.k?.setData(stochK);
      seriesRef.current.d?.setData(stochD);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesticks, stochChart]);

  return { stochChart };
};
