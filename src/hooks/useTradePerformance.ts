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
  }
  console.log(grossProfit);
  console.log(grossLoss);

  const netProfit = grossProfit - grossLoss;

  const equityMax = Math.max(...equityTimeline);
  const equityMin = Math.min(...equityTimeline);
  const maxRunUp = equityMax;
  const maxDrawdown = equityMax - equityMin;

  const buyAndHoldReturn = finalPrice - initialPrice;
  const winRate = (win / (win + loss)) * 100;

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
    isLoading,
    startDate: data?.startDate,
    endDate: data?.endDate,
  };
};
