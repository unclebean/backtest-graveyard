import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { IndicatorInCandleChartWithVwapProps } from '@/types/chart';

export const useVwap = ({
  candlesChart,
  candlesticks,
  vwap,
  color = 'yellow',
}: IndicatorInCandleChartWithVwapProps) => {
  const seriesRef = useRef<ISeriesApi<"Line"> | undefined>(undefined);
  const prevChartRef = useRef<IChartApi | undefined>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!candlesChart) return;
    
    if (!seriesRef.current || prevChartRef.current !== candlesChart) {
      seriesRef.current = candlesChart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
      });
      prevChartRef.current = candlesChart;
    }

    if (candlesticks.length === 0) return;

    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1 && vwap.length > 0) {
      seriesRef.current.update(vwap[vwap.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.setData(vwap);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesChart, candlesticks, color, vwap]);

  return { candlesChart };
};
