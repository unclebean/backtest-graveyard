import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { EMA } from 'technicalindicators';
import { IndicatorInCandleChartWithPeriodProps } from '@/types/chart';

export const useEma = ({
  candlesChart,
  candlesticks,
  period = 20,
  color = '#ff6d00',
}: IndicatorInCandleChartWithPeriodProps) => {
  const seriesRef = useRef<ISeriesApi<"Line"> | undefined>(undefined);
  const prevChartRef = useRef<IChartApi | undefined>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!candlesChart) return;
    
    if (!seriesRef.current || prevChartRef.current !== candlesChart) {
      seriesRef.current = candlesChart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        priceLineVisible: false,
      });
      prevChartRef.current = candlesChart;
    }

    if (candlesticks.length === 0) return;

    const close = candlesticks.map((c) => c.close);

    const emaResult = EMA.calculate({
      period,
      values: close,
    });
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - emaResult.length;
    const timeTrimmed = time.slice(offset);
    const emaLine = emaResult.map((v, i) => ({
      time: timeTrimmed[i],
      value: v,
    }));
    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.update(emaLine[emaLine.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.setData(emaLine);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesChart, candlesticks, color, period]);

  return { candlesChart };
};
