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
  const buyAndHoldCurve: { time: number; value: number }[] = [];
  const drawdownCurve: { time: number; value: number }[] = [];
  const volatilityCurve: { time: number; value: number }[] = [];
  let lastTimestamp = 0;

  if (trades.length > 0) {
    const firstEntryStr = trades[0].entry_date || trades[0].exit_date;
    const firstTimestamp = parseDate(firstEntryStr);
    const startVal = { time: firstTimestamp - 3600, value: 0 };
    equityCurve.push(startVal);
    buyAndHoldCurve.push(startVal);
    drawdownCurve.push(startVal);
    volatilityCurve.push(startVal);
    lastTimestamp = firstTimestamp - 3600;
  }

  let runningPeak = 0;
  let runningPnl = 0;
  const pctChanges: number[] = [];
  const basePrice = initialPrice || (trades.length > 0 ? trades[0].opened_position : 1);

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

    // 1. Buy and Hold Curve
    const assetPct = ((trade.closed_position - basePrice) / basePrice) * 100;
    buyAndHoldCurve.push({
      time: exitTimestamp,
      value: Number(assetPct.toFixed(4)),
    });

    // 2. Drawdown Curve
    runningPnl += pnl;
    if (runningPnl > runningPeak) {
      runningPeak = runningPnl;
    }
    const currentDd = runningPeak - runningPnl;
    const currentDdPct = (currentDd / INITIAL_BALANCE) * 100;
    drawdownCurve.push({
      time: exitTimestamp,
      value: Number((-currentDdPct).toFixed(4)),
    });

    // 3. Volatility Curve (Running Standard Deviation of trade percentages)
    pctChanges.push(tradePct);
    const mean = pctChanges.reduce((a, b) => a + b, 0) / pctChanges.length;
    const variance = pctChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pctChanges.length;
    const stdDev = Math.sqrt(variance);
    volatilityCurve.push({
      time: exitTimestamp,
      value: Number(stdDev.toFixed(4)),
    });
  }

  const netProfit = grossProfit - grossLoss;

  // Standard peak-to-trough max drawdown calculation
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnlForDd = 0;
  for (const trade of trades) {
    runningPnlForDd += trade.result;
    if (runningPnlForDd > peak) {
      peak = runningPnlForDd;
    }
    const dd = peak - runningPnlForDd;
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
    buyAndHoldCurve,
    drawdownCurve,
    volatilityCurve,
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
