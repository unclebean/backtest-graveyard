import { useChartResize } from '@/hooks/useChartResize';
import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { CCI } from 'technicalindicators';
import { IndicatorChartProps } from '@/types/chart';

export const useCciChart = ({
  candlesticks,
  indicatorChartRef,
}: IndicatorChartProps) => {
  const [cciChart, setCciChart] = useState<IChartApi>();
  useChartResize(cciChart, indicatorChartRef);
  const seriesRef = useRef<ISeriesApi<"Line"> | undefined>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!indicatorChartRef?.current || candlesticks.length === 0 || cciChart) return;
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

    const cciSeries = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 1,
      priceLineVisible: false,
    });

    cciSeries.createPriceLine({
      price: 150,
      color: 'orange',
      lineWidth: 1,
      lineStyle: 1, // 0 = solid, 1 = dotted, 2 = dashed
      axisLabelVisible: true,
      title: '',
    });

    cciSeries.createPriceLine({
      price: -150,
      color: 'orange',
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: '',
    });

    cciSeries.createPriceLine({
      price: 0,
      color: 'red',
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: '',
    });

    seriesRef.current = cciSeries;

    setCciChart(chart);
  }, [indicatorChartRef, candlesticks.length, cciChart]);

  useEffect(() => {
    return () => {
      if (cciChart) {
        cciChart.remove();
      }
    };
  }, [cciChart]);

  useEffect(() => {
    if (!cciChart || candlesticks.length === 0 || !seriesRef.current) return;

    const period = 7;
    const result = CCI.calculate({
      high: candlesticks.map((c) => c.high),
      low: candlesticks.map((c) => c.low),
      close: candlesticks.map((c) => c.close),
      period,
    });
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - result.length;

    const cciWithTime = time.map((v, i) => ({
      time: v,
      value: i < offset ? 0 : result[i - offset],
    }));
    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.update(cciWithTime[cciWithTime.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.setData(cciWithTime);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesticks, cciChart]);

  return { cciChart };
};
