'use client';

import { useTradePerformance } from '@/hooks/useTradePerformance';
import { ITradeDataParams } from '@/types/trade';

export default function StrategyPerformanceOverlay(
  tradeDataParams: Readonly<ITradeDataParams>,
) {
  const { data, isLoading } = useTradePerformance(tradeDataParams);

  if (isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 px-4 sm:px-0 flex items-center justify-center flex-col gap-2.5 bg-black/80 text-white font-bold">
      <h2 className="text-2xl">Performance</h2>
      <div className="text-base space-y-1">
        <ul className="list-none grid grid-cols-2 gap-x-6 gap-y-4">
          <li>
            <div className="text-left space-y-1">
              <div className="text-sm text-muted-foreground">Net Profit</div>
              <div className="text-base font-bold">
                {data.netProfit.toFixed(3)}
              </div>
            </div>
          </li>
          <li>
            <div className="text-left space-y-1">
              <div className="text-sm text-muted-foreground">Gross Profit</div>
              <div className="text-base font-bold">
                {data.grossProfit.toFixed(3)}
              </div>
            </div>
          </li>
          <li>
            <div className="text-left space-y-1">
              <div className="text-sm text-muted-foreground">Gross Loss</div>
              <div className="text-base font-bold">
                {data.grossLoss.toFixed(3)}
              </div>
            </div>
          </li>
          <li>
            <div className="text-left space-y-1">
              <div className="text-sm text-muted-foreground">Trading Fee</div>
              <div className="text-base font-bold">
                {data.commissionPaid.toFixed(3)}
              </div>
            </div>
          </li>
          <li>
            <div className="text-left space-y-1">
              <div className="text-sm text-muted-foreground">Max Run Up</div>
              <div className="text-base font-bold">
                {data.maxRunUp.toFixed(3)}
              </div>
            </div>
          </li>
          <li>
            <div className="text-left space-y-1">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="text-base font-bold">
                {data.maxDrawdown.toFixed(3)}
              </div>
            </div>
          </li>
          <li>
            <div className="text-left space-y-1">
              <div className="text-sm text-muted-foreground">
                Buy and Hold Return
              </div>
              <div className="text-base font-bold">
                {data.buyAndHoldReturn.toFixed(3)}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
