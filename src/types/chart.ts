import { CandlestickData, IChartApi } from 'lightweight-charts';
import { RefObject } from 'react';
import { IOrder, IVwap } from '@/types/trade';

export interface Position {
  time: number;
  position: string;
  color: string;
  shape: string;
  text: string;
  result?: number;
  entry_signal?: string;
}

export interface CandlesticksProps {
  candlesticks: CandlestickData[];
}

export interface IndicatorChartProps extends CandlesticksProps {
  indicatorChartRef: RefObject<HTMLDivElement | null>;
  height?: number;
}

export interface IndicatorInCandleChartProps {
  candlesChart?: IChartApi;
  candlesticks: CandlestickData[];
}

export interface IndicatorInCandleChartWithPeriodProps
  extends IndicatorInCandleChartProps {
  period: number;
  color?: string;
}

export interface CandlestickChartProps {
  candlesticks: CandlestickData[];
  candlestickChartRef: RefObject<HTMLDivElement | null>;
  positions: Position[];
  updateWin: (totalWin: number) => void;
  updateLoss: (totalLoss: number) => void;
  onFinish: () => void;
  height?: number;
  updateTotalProfit?: (result: number) => void;
}

export interface CandlestickReplayChartProps {
  title?: string;
  candlesticks: CandlestickData[];
  orders: IOrder[];
  setChart?: (chart: IChartApi) => void;
}

export interface IndicatorInCandleChartWithVwapProps
  extends IndicatorInCandleChartProps {
  color?: string;
  vwap: IVwap[];
}

export interface CandlestickReplayChartWithPositionsProps {
  title: string;
  candlesticks: CandlestickData[];
  positions: Position[];
  initialBalance: number;
  setChart?: (chart: IChartApi) => void;
  onFinish?: () => void;
  onTick?: (currentData: CandlestickData[]) => void;
}
