import { useQuery } from '@tanstack/react-query';
import { ITradeDataParams } from '@/types/trade';

const loadBacktestData = async ({ symbol, strategy }: ITradeDataParams) => {
  const res = await fetch(
    `/api/candles?symbol=${symbol}&strategy=${strategy}`,
    {},
  );
  return res.json();
};

export const useBacktestData = (tradeDataParams: ITradeDataParams) => {
  return useQuery({
    queryKey: ['candles'],
    queryFn: () => loadBacktestData(tradeDataParams),
  });
};
