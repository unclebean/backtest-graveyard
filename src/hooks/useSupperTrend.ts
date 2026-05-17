import { ATR } from 'technicalindicators';
import { CandlestickData, LineSeries, Time } from 'lightweight-charts';
import { IndicatorInCandleChartProps } from '@/types/chart';
import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';

interface SupperTrendProps {
  time: Time;
  value: number;
  direction: string;
}

function calculateSuperTrend(
  candlesticks: CandlestickData[],
  period = 10,
  multiplier = 3,
) {
  const high = candlesticks.map((c) => c.high);
  const low = candlesticks.map((c) => c.low);
  const close = candlesticks.map((c) => c.close);
  const time = candlesticks.map((c) => c.time);
  const atr = ATR.calculate({ high, low, close, period });
  const superTrend = [];
  let inUptrend = true;
  let prevFinalUpperBand = 0;
  let prevFinalLowerBand = 0;

  for (let i = 0; i < atr.length; i++) {
    const idx = i + period;
    const hl2 = (high[idx] + low[idx]) / 2;
    const atrValue = atr[i];

    const basicUpperBand = hl2 + multiplier * atrValue;
    const basicLowerBand = hl2 - multiplier * atrValue;

    let finalUpperBand = basicUpperBand;
    let finalLowerBand = basicLowerBand;

    if (i > 0) {
      if (
        basicUpperBand < prevFinalUpperBand ||
        close[idx - 1] > prevFinalUpperBand
      ) {
        finalUpperBand = basicUpperBand;
      } else {
        finalUpperBand = prevFinalUpperBand;
      }

      if (
        basicLowerBand > prevFinalLowerBand ||
        close[idx - 1] < prevFinalLowerBand
      ) {
        finalLowerBand = basicLowerBand;
      } else {
        finalLowerBand = prevFinalLowerBand;
      }
    }

    let trend: boolean = inUptrend;
    let stValue;

    if (inUptrend) {
      if (close[idx] < finalLowerBand) {
        trend = false;
        stValue = finalUpperBand;
      } else {
        stValue = finalLowerBand;
      }
    } else {
      if (close[idx] > finalUpperBand) {
        trend = true;
        stValue = finalLowerBand;
      } else {
        stValue = finalUpperBand;
      }
    }

    superTrend.push({
      time: time[idx],
      value: stValue,
      direction: trend ? 'up' : 'down',
    });

    // Store for next iteration
    inUptrend = trend;
    prevFinalUpperBand = finalUpperBand;
    prevFinalLowerBand = finalLowerBand;
  }

  return superTrend;
}

function splitSuperTrendSegments(data: SupperTrendProps[]) {
  const segments = [];
  let currentSegment: { time: Time; value: number }[] = [];
  let currentDirection = data[0]?.direction;

  for (const point of data) {
    if (point.direction === currentDirection) {
      currentSegment.push({ time: point.time, value: point.value });
    } else {
      if (currentSegment.length > 0) {
        segments.push({ direction: currentDirection, data: currentSegment });
      }
      currentDirection = point.direction;
      currentSegment = [{ time: point.time, value: point.value }];
    }
  }

  if (currentSegment.length > 0) {
    segments.push({ direction: currentDirection, data: currentSegment });
  }

  return segments;
}

export const useSupperTrend = ({
  candlesChart,
  candlesticks,
}: IndicatorInCandleChartProps) => {
  const seriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const prevChartRef = useRef<IChartApi | undefined>(undefined);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!candlesChart || candlesticks.length === 0) return;

    const superTrendData = calculateSuperTrend(candlesticks, 10, 3);
    const segments = splitSuperTrendSegments(superTrendData);

    if (prevChartRef.current !== candlesChart) {
      seriesRef.current = [];
      prevChartRef.current = candlesChart;
    }

    if (lastLengthRef.current > 0 && (candlesticks.length === lastLengthRef.current + 1 || candlesticks.length === lastLengthRef.current)) {
      // Remove any extra series if segments decreased (e.g. trend flipped back during live tick)
      while (seriesRef.current.length > segments.length) {
        const extraSeries = seriesRef.current.pop();
        if (extraSeries) candlesChart.removeSeries(extraSeries);
      }

      const lastSegment = segments[segments.length - 1];
      const lastSeriesIndex = segments.length - 1;
      
      if (!seriesRef.current[lastSeriesIndex]) {
        seriesRef.current[lastSeriesIndex] = candlesChart.addSeries(LineSeries, {
          color: lastSegment.direction === 'up' ? 'green' : 'red',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        seriesRef.current[lastSeriesIndex].setData(lastSegment.data);
      } else {
        seriesRef.current[lastSeriesIndex].update(lastSegment.data[lastSegment.data.length - 1]);
      }

      // If there was a direction change, ensure the previous segment is up to date
      if (lastSeriesIndex > 0 && seriesRef.current[lastSeriesIndex - 1]) {
        seriesRef.current[lastSeriesIndex - 1].setData(segments[lastSeriesIndex - 1].data);
      }
    } else {
      while (seriesRef.current.length > segments.length) {
        const extraSeries = seriesRef.current.pop();
        if (extraSeries) candlesChart.removeSeries(extraSeries);
      }

      segments.forEach((segment, i) => {
        if (!seriesRef.current[i]) {
          seriesRef.current[i] = candlesChart.addSeries(LineSeries, {
            color: segment.direction === 'up' ? 'green' : 'red',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
        } else {
          seriesRef.current[i].applyOptions({
            color: segment.direction === 'up' ? 'green' : 'red',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
        }
        seriesRef.current[i].setData(segment.data);
      });
    }
    lastLengthRef.current = candlesticks.length;
  }, [candlesChart, candlesticks]);

  return { candlesChart };
};
