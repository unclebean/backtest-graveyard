import { useQuery } from '@tanstack/react-query';
import { ITradeDataParams } from '@/types/trade';

const loadVwapData = async ({ symbol }: ITradeDataParams) => {
  const res = await fetch(`/api/vwap?symbol=${symbol}`, {});
  return res.json();
};

export const useVwapData = (tradeDataParams: ITradeDataParams) => {
  return useQuery({
    queryKey: ['vwap'],
    queryFn: () => loadVwapData(tradeDataParams),
  });
};
