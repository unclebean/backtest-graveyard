import { useChartResize } from '@/hooks/useChartResize';
import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { CCI } from 'technicalindicators';
import { IndicatorChartProps } from '@/types/chart';

export const useDoubleCciChart = ({
  candlesticks,
  indicatorChartRef,
}: IndicatorChartProps) => {
  const [cciChart, setCciChart] = useState<IChartApi>();
  useChartResize(cciChart, indicatorChartRef);
  const seriesRef = useRef<{
    cci25: ISeriesApi<"Line"> | undefined;
    cci50: ISeriesApi<"Line"> | undefined;
  }>(undefined);
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

    const cci25Series = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 1,
      priceLineVisible: false,
    });

    cci25Series.createPriceLine({
      price: 0,
      color: 'red',
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: '',
    });

    const cci50Series = chart.addSeries(LineSeries, {
      color: '#067483',
      lineWidth: 1,
      priceLineVisible: false,
    });

    seriesRef.current = {
      cci25: cci25Series,
      cci50: cci50Series,
    };

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

    const result25 = CCI.calculate({
      high: candlesticks.map((c) => c.high),
      low: candlesticks.map((c) => c.low),
      close: candlesticks.map((c) => c.close),
      period: 25,
    });
    const result50 = CCI.calculate({
      high: candlesticks.map((c) => c.high),
      low: candlesticks.map((c) => c.low),
      close: candlesticks.map((c) => c.close),
      period: 50,
    });

    const time = candlesticks.map((c) => c.time);

    const offset25 = candlesticks.length - result25.length;
    const cci25WithTime = time.map((v, i) => ({
      time: v,
      value: i < offset25 ? 0 : result25[i - offset25],
    }));

    const offset50 = candlesticks.length - result50.length;
    const cci50WithTime = time.map((v, i) => ({
      time: v,
      value: i < offset50 ? 0 : result50[i - offset50],
    }));
    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.cci25?.update(cci25WithTime[cci25WithTime.length - 1]);
      seriesRef.current.cci50?.update(cci50WithTime[cci50WithTime.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.cci25?.setData(cci25WithTime);
      seriesRef.current.cci50?.setData(cci50WithTime);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesticks, cciChart]);

  return { cciChart };
};
