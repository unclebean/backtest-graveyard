import { NextRequest, NextResponse } from 'next/server';
import { open } from 'sqlite';
import path from 'path';
import sqlite3 from 'sqlite3';
import { IMarketRaw } from '@/types/trade';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { isForex } from '@/lib/utils';

const getAllTrades = async (symbol: string, strategy: string) => {
  const db = await open({
    filename: path.join(process.cwd(), 'db/konjac2.db'),
    driver: sqlite3.Database,
  });

  const tradeSymbol = isForex(symbol) ? `${symbol}_USD` : `${symbol}_USDT:USDT`;

  const trades = await db.all(
    `SELECT *
         FROM trade
         WHERE strategy = '${strategy}'
         AND symbol = '${tradeSymbol}'
         AND entry_date is not null
         AND exit_date is not null
         ORDER BY entry_date ASC`,
  );

  const csvFileName = isForex(symbol)
    ? `${symbol}_USD_1_0.csv`
    : `${symbol}_USDT:USDT_1_0.csv`;

  const filePath = path.join(process.cwd(), `public/market/${csvFileName}`);
  const csvText = fs.readFileSync(filePath, 'utf8');

  const records: IMarketRaw[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  const initialCandleBar = records.find(
    (record) =>
      record.date === trades.at(0).entry_date.replaceAll('.000000', ''),
  ) ?? { close: 0 };
  const finalCandleBar = records.find(
    (record) =>
      record.date === trades.at(1).exit_date.replaceAll('.000000', ''),
  ) ?? { close: 0 };

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
