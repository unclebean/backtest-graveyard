import {
  ITrade,
  ITradeDataParams,
  ITradePerformance,
  ITradePerformanceResponse,
} from '@/types/trade';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isForex } from '@/lib/utils';

function calculatePerformance(
  symbol: string,
  trades: ITrade[],
  initialPrice: number,
  finalPrice: number,
): ITradePerformance {
  let grossProfit = 0;
  let grossLoss = 0;
  let commissionPaid = 0;
  let equity = 0;
  let win = 0;
  let loss = 0;
  const equityTimeline: number[] = [];

  const INITIAL_BALANCE = 10000;
  const parseDate = (dateStr: string) => {
    try {
      const sanitized = dateStr.replace(/\.\d+$/, '').replace(' ', 'T');
      const timeMs = new Date(sanitized).getTime();
      return isNaN(timeMs) ? Math.floor(Date.now() / 1000) : Math.floor(timeMs / 1000);
    } catch {
      return Math.floor(Date.now() / 1000);
    }
  };

  const equityCurve: { time: number; value: number }[] = [];
  const tradePnLHistory: { time: number; value: number; color: string }[] = [];
  let lastTimestamp = 0;

  if (trades.length > 0) {
    const firstEntryStr = trades[0].entry_date || trades[0].exit_date;
    const firstTimestamp = parseDate(firstEntryStr);
    equityCurve.push({
      time: firstTimestamp - 3600,
      value: 0,
    });
    lastTimestamp = firstTimestamp - 3600;
  }

  for (const trade of trades) {
    const pnl = trade.result;
    if (pnl >= 0) {
      grossProfit += pnl;
      win += 1;
    } else {
      grossLoss += Math.abs(pnl);
      loss += 1;
    }

    if (isForex(symbol)) {
      commissionPaid += 6;
    } else {
      commissionPaid += trade.opened_position * trade.quantity * 0.0005 * 2;
    }
    equity += pnl;
    equityTimeline.push(equity);

    let exitTimestamp = parseDate(trade.exit_date);
    if (exitTimestamp <= lastTimestamp) {
      exitTimestamp = lastTimestamp + 1;
    }
    lastTimestamp = exitTimestamp;

    const pctChange = (equity / INITIAL_BALANCE) * 100;
    const tradePct = (pnl / INITIAL_BALANCE) * 100;

    equityCurve.push({
      time: exitTimestamp,
      value: Number(pctChange.toFixed(4)),
    });

    tradePnLHistory.push({
      time: exitTimestamp,
      value: Number(tradePct.toFixed(4)),
      color: pnl >= 0 ? '#10b981' : '#ef4444',
    });
  }

  const netProfit = grossProfit - grossLoss;

  // Standard peak-to-trough max drawdown calculation
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;
  for (const trade of trades) {
    runningPnl += trade.result;
    if (runningPnl > peak) {
      peak = runningPnl;
    }
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  const maxRunUp = equityTimeline.length > 0 ? Math.max(...equityTimeline) : 0;
  const buyAndHoldReturn = finalPrice - initialPrice;
  const winRate = win + loss > 0 ? (win / (win + loss)) * 100 : 0;
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

  return {
    netProfit,
    grossProfit,
    grossLoss,
    commissionPaid,
    buyAndHoldReturn,
    maxRunUp,
    maxDrawdown,
    win,
    loss,
    winRate,
    profitFactor,
    equityCurve,
    tradePnLHistory,
  };
}

const loadTrades = async ({ symbol, strategy }: ITradeDataParams) => {
  const res = await fetch(
    `/api/tradePerformance?symbol=${symbol}&strategy=${strategy}`,
  );
  return res.json();
};

export const useTradePerformance = (tradeDataParams: ITradeDataParams) => {
  const { data, isLoading } = useQuery<ITradePerformanceResponse>({
    queryKey: ['performance'],
    queryFn: () => loadTrades(tradeDataParams),
  });
  const tradePerformance = useMemo(() => {
    if (isLoading || !data) return {} as ITradePerformance;
    const { trades, initialPrice, finalPrice } =
      data as ITradePerformanceResponse;
    return calculatePerformance(
      tradeDataParams.symbol,
      trades,
      initialPrice,
      finalPrice,
    );
  }, [data, isLoading, tradeDataParams.symbol]);
  return {
    data: tradePerformance,
    trades: data?.trades ?? [],
    isLoading,
    startDate: data?.startDate,
    endDate: data?.endDate,
  };
};
