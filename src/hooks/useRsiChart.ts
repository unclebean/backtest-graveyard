import { useChartResize } from '@/hooks/useChartResize';
import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { RSI } from 'technicalindicators';
import { IndicatorChartProps } from '@/types/chart';

export const useRsiChart = ({
  candlesticks,
  indicatorChartRef,
}: IndicatorChartProps) => {
  const [rsiChart, setRsiChart] = useState<IChartApi>();
  useChartResize(rsiChart, indicatorChartRef);
  const seriesRef = useRef<ISeriesApi<"Line"> | undefined>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!indicatorChartRef?.current || candlesticks.length === 0 || rsiChart) return;
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

    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 1,
      priceLineVisible: false,
    });

    rsiSeries.createPriceLine({
      price: 80,
      color: 'yellow',
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: '',
    });

    rsiSeries.createPriceLine({
      price: 20,
      color: 'yellow',
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: '',
    });

    rsiSeries.applyOptions({
      autoscaleInfoProvider: () => {
        return {
          priceRange: {
            minValue: 10,
            maxValue: 90,
          },
        };
      },
    });

    seriesRef.current = rsiSeries;

    setRsiChart(chart);
  }, [indicatorChartRef, candlesticks.length, rsiChart]);

  useEffect(() => {
    return () => {
      if (rsiChart) {
        rsiChart.remove();
      }
    };
  }, [rsiChart]);

  useEffect(() => {
    if (!rsiChart || candlesticks.length === 0 || !seriesRef.current) return;

    const period = 14;
    const result = RSI.calculate({
      values: candlesticks.map((c) => c.close),
      period,
    });
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - result.length;
    const rsiWithTime = time.map((v, i) => ({
      time: v,
      value: i < offset ? 0 : result[i - offset],
    }));

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.update(rsiWithTime[rsiWithTime.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.setData(rsiWithTime);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesticks, rsiChart]);

  return { rsiChart };
};
