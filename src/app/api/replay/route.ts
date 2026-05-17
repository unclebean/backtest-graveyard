import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dayjs from 'dayjs';
import { isForex } from '@/lib/utils';

interface CandleBar {
  date: string;
  high: string;
  low: string;
  close: string;
  open: string;
}

// Optional: fallback if no SQLite
function readCSV(symbol: string, startDate: number | string) {
  const csvFileName = isForex(symbol)
    ? `${symbol}_USD_1_0.csv`
    : `${symbol}_USDT:USDT_1_0.csv`;

  const filePath = path.join(process.cwd(), `public/market/${csvFileName}`);
  const csvText = fs.readFileSync(filePath, 'utf8');

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  return records
    .filter((r: CandleBar) => new Date(r.date) >= new Date(startDate))
    .map((r: CandleBar) => ({
      time: Math.floor(dayjs(r.date).unix()),
      open: parseFloat(r.open),
      high: parseFloat(r.high),
      low: parseFloat(r.low),
      close: parseFloat(r.close),
    }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') ?? '';
  const startDate = searchParams.get('startDate') ?? '2024-01-01 00:00:00';
  const marketData = readCSV(symbol, startDate);
  return NextResponse.json({
    marketData: marketData,
  });
}
