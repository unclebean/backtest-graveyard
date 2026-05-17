import { useChartResize } from '@/hooks/useChartResize';
import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { ADX } from 'technicalindicators';
import { IndicatorChartProps } from '@/types/chart';

export const useAdxChart = ({
  candlesticks,
  indicatorChartRef,
  height = 150,
}: IndicatorChartProps) => {
  const [adxChart, setAdxChart] = useState<IChartApi>();
  useChartResize(adxChart, indicatorChartRef);
  const seriesRef = useRef<{
    adx: ISeriesApi<"Line"> | undefined;
    pdi: ISeriesApi<"Line"> | undefined;
    mdi: ISeriesApi<"Line"> | undefined;
  }>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!indicatorChartRef?.current || candlesticks.length === 0 || adxChart) return;
    const chart = createChart(indicatorChartRef.current, {
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
        shiftVisibleRangeOnNewBar: false,
      },
    });

    const adxSeries = chart.addSeries(LineSeries, {
      color: '#f50057',
      lineWidth: 1,
      priceLineVisible: false,
    });
    adxSeries.createPriceLine({
      price: 20,
      color: 'purple',
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: true,
      title: '',
    });

    const pdiSeries = chart.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 1,
      priceLineVisible: false,
    });

    const mdiSeries = chart.addSeries(LineSeries, {
      color: '#ff6d00',
      lineWidth: 1,
      priceLineVisible: false,
    });

    seriesRef.current = {
      adx: adxSeries,
      pdi: pdiSeries,
      mdi: mdiSeries,
    };

    setAdxChart(chart);
  }, [height, indicatorChartRef, candlesticks.length, adxChart]);

  useEffect(() => {
    return () => {
      if (adxChart) {
        adxChart.remove();
      }
    };
  }, [adxChart]);

  useEffect(() => {
    if (!adxChart || candlesticks.length === 0 || !seriesRef.current) return;

    const period = 14;
    const result = ADX.calculate({
      high: candlesticks.map((c) => c.high),
      low: candlesticks.map((c) => c.low),
      close: candlesticks.map((c) => c.close),
      period,
    });
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - result.length;
    const adxWithTime = time.map((v, i) => ({
      time: v,
      value: i < offset ? 0 : (result[i - offset]?.adx || 0),
    }));

    const pdiWithTime = time.map((v, i) => ({
      time: v,
      value: i < offset ? 0 : (result[i - offset]?.pdi || 0),
    }));

    const mdiWithTime = time.map((v, i) => ({
      time: v,
      value: i < offset ? 0 : (result[i - offset]?.mdi || 0),
    }));

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.adx?.update(adxWithTime[adxWithTime.length - 1]);
      seriesRef.current.pdi?.update(pdiWithTime[pdiWithTime.length - 1]);
      seriesRef.current.mdi?.update(mdiWithTime[mdiWithTime.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.adx?.setData(adxWithTime);
      seriesRef.current.pdi?.setData(pdiWithTime);
      seriesRef.current.mdi?.setData(mdiWithTime);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesticks, adxChart]);

  return { adxChart };
};
