import { Time } from 'lightweight-charts';

export interface IMarketRaw {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ITrade {
  id: string;
  symbol: string;
  strategy: string;
  trend: string;
  entry_signal: string;
  entry_date: string;
  opened_position: number;
  exit_signal: string;
  exit_date: string;
  closed_position: number;
  result: number;
  quantity: number;
}

export interface ITradePerformance {
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  commissionPaid: number;
  buyAndHoldReturn: number;
  maxRunUp: number;
  maxDrawdown: number;
  win: number;
  loss: number;
  winRate: number;
  profitFactor: number;
  equityCurve: { time: number; value: number }[];
  tradePnLHistory: { time: number; value: number; color: string }[];
}

export interface ITradePerformanceResponse {
  trades: ITrade[];
  initialPrice: number;
  finalPrice: number;
  startDate?: string;
  endDate?: string;
}

export interface ITradeDataParams {
  symbol: string;
  strategy: string;
}

export interface IOrder {
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  status:
    | 'new'
    | 'submitted'
    | 'partialFilled'
    | 'filled'
    | 'cancelled'
    | 'closed'
    | 'closed take profit'
    | 'closed stop loss';
  price: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  orderClosePrice?: number;
}

export interface IVwap {
  time: Time;
  value: number;
}
