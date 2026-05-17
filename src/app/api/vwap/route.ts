import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dayjs from 'dayjs';

interface VwapBar {
  date: string;
  VWAP_D: string;
}

// Optional: fallback if no SQLite
function readCSV(symbol: string, startDate: number | string) {
  const csvFileName = `${symbol}_VWAP.csv`;

  const filePath = path.join(process.cwd(), `public/market/${csvFileName}`);
  const csvText = fs.readFileSync(filePath, 'utf8');

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  return records
    .filter((r: VwapBar) => new Date(r.date) >= new Date(startDate))
    .map((r: VwapBar) => ({
      time: Math.floor(dayjs(r.date).unix()),
      value: parseFloat(r.VWAP_D),
    }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') ?? '';
  const startDate = searchParams.get('startDate') ?? '2024-01-01 00:00:00';
  const vwapData = readCSV(symbol, startDate);
  return NextResponse.json(vwapData);
}
