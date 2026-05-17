import { useQuery } from '@tanstack/react-query';
import { ITradeDataParams } from '@/types/trade';

const loadReplayData = async ({ symbol }: ITradeDataParams) => {
  const res = await fetch(`/api/replay?symbol=${symbol}`, {});
  return res.json();
};

export const useReplayData = (tradeDataParams: ITradeDataParams) => {
  return useQuery({
    queryKey: ['replay'],
    queryFn: () => loadReplayData(tradeDataParams),
  });
};
