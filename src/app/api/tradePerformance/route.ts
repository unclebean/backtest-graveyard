import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { IMarketRaw, ITrade } from '@/types/trade';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { isForex } from '@/lib/utils';

const getAllTrades = async (symbol: string, strategy: string) => {
  const jsonPath = path.join(process.cwd(), `public/data/trades/${strategy}.json`);
  let trades = [] as ITrade[];
  
  if (fs.existsSync(jsonPath)) {
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const allTrades = JSON.parse(fileContent) as ITrade[];
    const tradeSymbol = isForex(symbol) ? `${symbol}_USD` : `${symbol}_USDT:USDT`;
    
    trades = allTrades
      .filter((t: ITrade) => t.symbol === tradeSymbol && t.entry_date !== null && t.exit_date !== null)
      .sort((a: ITrade, b: ITrade) => a.entry_date.localeCompare(b.entry_date));
  }

  const csvFileName = isForex(symbol)
    ? `${symbol}_USD_1_0.csv`
    : `${symbol}_USDT:USDT_1_0.csv`;

  const filePath = path.join(process.cwd(), `public/market/${csvFileName}`);
  const csvText = fs.readFileSync(filePath, 'utf8');

  const records: IMarketRaw[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  const firstTrade = trades.at(0);
  const secondTrade = trades.at(1);

  const initialCandleBar = (firstTrade && records.find(
    (record) =>
      record.date === firstTrade.entry_date.replaceAll('.000000', ''),
  )) ?? { close: 0 };

  const finalCandleBar = (secondTrade && records.find(
    (record) =>
      record.date === secondTrade.exit_date.replaceAll('.000000', ''),
  )) ?? { close: 0 };

  return {
    trades,
    initialPrice: initialCandleBar.close,
    finalPrice: finalCandleBar.close,
  };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') ?? '';
  const strategy = searchParams.get('strategy') ?? '';
  const trades = await getAllTrades(symbol, strategy);
  return NextResponse.json(trades);
}
