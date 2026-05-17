import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  BarChart3,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTradePerformance } from '@/hooks/useTradePerformance';

interface StrategyStatsCardProps {
  name: string;
  symbol: string;
  strategy: string;
  onStartAction: () => void;
  subTitle?: string;
}

export default function StrategyStatsCard({
  name,
  symbol,
  strategy,
  onStartAction,
  subTitle,
}: Readonly<StrategyStatsCardProps>) {
  const { data, isLoading } = useTradePerformance({ symbol, strategy });

  if (isLoading) {
    return null;
  }

  return (
    <Card className="max-w-md p-4 bg-black text-white rounded-2xl shadow-lg">
      <CardContent className="space-y-4 px-4">
        <h2 className="text-xl font-bold text-center">
          {name}
          {subTitle && (
            <div className="text-sm font-bold text-center">{subTitle}</div>
          )}
        </h2>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            {data.netProfit > 0 ? (
              <CheckCircle className="text-green-500" />
            ) : (
              <XCircle className="text-red-500" />
            )}
            <span>NET PROFIT</span>
          </div>
          <span
            className={`${data.netProfit > 0 ? 'text-green-500' : 'text-red-500'} font-semibold`}
          >
            {`${data.netProfit.toFixed(2)}`}
            <sup className="text-[8px]">USD</sup>
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="text-red-500" />
            <span>Trading Fee</span>
          </div>
          <span>
            {`${data.commissionPaid.toFixed(2)}`}
            <sup className="text-[8px]">USD</sup>
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            {data.win > data.loss ? (
              <CheckCircle className="text-yellow-300" />
            ) : (
              <XCircle className="text-yellow-300" />
            )}
            <span>WIN / LOSS</span>
          </div>
          <div className="space-x-1">
            <Badge className="bg-green-600">{data.win}</Badge>
            <Badge className="bg-red-600">{data.loss}</Badge>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            {data.winRate > 50 ? (
              <TrendingUp className="text-yellow-300" />
            ) : (
              <TrendingDown className="text-yellow-300" />
            )}
            <span>WIN RATE</span>
          </div>
          <span>{`${data.winRate.toFixed(2)}%`}</span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="text-green-500" />
            <span>MAX RUN UP</span>
          </div>
          <span>
            {`${data.maxRunUp.toFixed(2)}`}
            <sup className="text-[8px]">USD</sup>
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <TrendingDown className="text-red-500" />
            <span>MAX DRAWDOWN</span>
          </div>
          <span>
            {`${data.maxDrawdown.toFixed(2)}`}
            <sup className="text-[8px]">USD</sup>
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <BarChart3 />
            <span>GROSS PROFIT</span>
          </div>
          <span>
            {`${data.grossProfit.toFixed(2)}`}
            <sup className="text-[8px]">USD</sup>
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <BarChart2 />
            <span>GROSS LOSS</span>
          </div>
          <span>
            {`${data.grossLoss.toFixed(2)}`}
            <sup className="text-[8px]">USD</sup>
          </span>
        </div>

        <div className="flex justify-center items-center">
          <Button size="lg" className="cursor-pointer" onClick={onStartAction}>
            <PlayCircle className="w-24 h-24 text-red-600" />
            Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
