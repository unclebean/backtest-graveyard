import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { BollingerBands } from 'technicalindicators';
import { IndicatorInCandleChartProps } from '@/types/chart';

export const useBollingerBands = ({
  candlesChart,
  candlesticks,
}: IndicatorInCandleChartProps) => {
  const seriesRef = useRef<{
    lower: ISeriesApi<"Line"> | undefined;
    middle: ISeriesApi<"Line"> | undefined;
    upper: ISeriesApi<"Line"> | undefined;
  }>(undefined);
  const prevChartRef = useRef<IChartApi | undefined>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!candlesChart) return;
    
    if (!seriesRef.current || prevChartRef.current !== candlesChart) {
      seriesRef.current = {
        lower: candlesChart.addSeries(LineSeries, { color: '#ff6d00', lineWidth: 1, priceLineVisible: false }),
        middle: candlesChart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 1, priceLineVisible: false }),
        upper: candlesChart.addSeries(LineSeries, { color: '#ff6d00', lineWidth: 1, priceLineVisible: false }),
      };
      prevChartRef.current = candlesChart;
    }
    
    if (candlesticks.length === 0) return;

    const close = candlesticks.map((c) => c.close);

    const bbResult = BollingerBands.calculate({
      period: 34,
      values: close,
      stdDev: 2,
    });
    const time = candlesticks.map((c) => c.time);
    const offset = candlesticks.length - bbResult.length;
    const timeTrimmed = time.slice(offset);
    const lowerLine = bbResult.map((v, i) => ({
      time: timeTrimmed[i],
      value: v.lower,
    }));

    const middlelLine = bbResult.map((v, i) => ({
      time: timeTrimmed[i],
      value: v.middle,
    }));

    const upperLine = bbResult.map((v, i) => ({
      time: timeTrimmed[i],
      value: v.upper,
    }));

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1) {
      seriesRef.current?.lower?.update(lowerLine[lowerLine.length - 1]);
      seriesRef.current?.middle?.update(middlelLine[middlelLine.length - 1]);
      seriesRef.current?.upper?.update(upperLine[upperLine.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current?.lower?.setData(lowerLine);
      seriesRef.current?.middle?.setData(middlelLine);
      seriesRef.current?.upper?.setData(upperLine);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesChart, candlesticks]);

  return { candlesChart };
};
