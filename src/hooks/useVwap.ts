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

    if (candlesticks.length === 0 || vwap.length === 0) return;
    
    const currentTickTime = candlesticks[candlesticks.length - 1].time;
    const vwapLine = vwap.filter((v) => v.time <= currentTickTime);
    
    if (lastLengthRef.current > 0 && candlesticks.length === lastLengthRef.current + 1 && vwapLine.length > 0) {
      seriesRef.current.update(vwapLine[vwapLine.length - 1]);
    } else if (candlesticks.length !== lastLengthRef.current) {
      seriesRef.current.setData(vwapLine);
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesChart, candlesticks, color, vwap]);

  return { candlesChart };
};
