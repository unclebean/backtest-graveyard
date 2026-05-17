import { CandlesticksProps } from '@/types/chart';
import { useMemo } from 'react';

export const useHeikinAshiData = ({ candlesticks }: CandlesticksProps) => {
  return useMemo(() => {
    if (!candlesticks[0]) {
      return [];
    }
    const haData = [];
    let prevHaOpen = candlesticks[0].open;
    let prevHaClose =
      (candlesticks[0].open +
        candlesticks[0].high +
        candlesticks[0].low +
        candlesticks[0].close) /
      4;

    for (const element of candlesticks) {
      const { open, high, low, close, time } = element;
      const haClose = (open + high + low + close) / 4;
      const haOpen = (prevHaOpen + prevHaClose) / 2;
      const haHigh = Math.max(high, haOpen, haClose);
      const haLow = Math.min(low, haOpen, haClose);

      haData.push({
        time,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
      });

      prevHaOpen = haOpen;
      prevHaClose = haClose;
    }

    return haData;
  }, [candlesticks]);
};
