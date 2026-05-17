import { WMA } from 'technicalindicators';
import { IndicatorInCandleChartWithPeriodProps } from '@/types/chart';
import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';

function calculateHMA(values: number[], period: number): number[] {
  if (period < 2) throw new Error('HMA period must be >= 2');

  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.floor(Math.sqrt(period));

  const wmaHalf = WMA.calculate({ period: halfPeriod, values });
  const wmaFull = WMA.calculate({ period, values });

  const diff: number[] = [];
  const minLen = Math.min(wmaHalf.length, wmaFull.length);

  for (let i = 0; i < minLen; i++) {
    diff.push(2 * wmaHalf[i + (wmaHalf.length - minLen)] - wmaFull[i]);
  }

  const hma = WMA.calculate({ period: sqrtPeriod, values: diff });
  return Array(values.length - hma.length)
    .fill(0)
    .concat(hma); // pad start with NaN
}

export const useHma = ({
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

    const hmaResult = calculateHMA(close, period);
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - hmaResult.length;
    const timeTrimmed = time.slice(offset);
    const hmaLine = hmaResult.map((v, i) => ({
      time: timeTrimmed[i],
      value: v,
    }));

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current.update(hmaLine[hmaLine.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.setData(hmaLine);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesChart, candlesticks, color, period]);

  return { candlesChart };
};
