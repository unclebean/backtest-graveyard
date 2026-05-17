import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dayjs from 'dayjs';
import { isForex } from '@/lib/utils';

interface Position {
  time: string;
  position: string;
  color: string;
  shape: string;
  text: string;
  quantity?: number;
  result?: number;
  entry_signal?: string;
}

interface CandleBar {
  date: string;
  high: string;
  low: string;
  close: string;
  open: string;
  volume: string;
}

const positionsMap = new Map<string, Position[]>();

async function queryFromJSON(strategy: string) {
  const cached = positionsMap.get(strategy);
  if (cached) {
    return cached.map((position) => ({
      ...position,
      time: Math.floor(dayjs(position.time).unix()),
    }));
  }

  const jsonPath = path.join(process.cwd(), `public/data/trades/${strategy}.json`);
  if (!fs.existsSync(jsonPath)) {
    return [];
  }

  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  const rows = JSON.parse(fileContent);

  const positions = [] as Position[];
  for (const row of rows) {
    if (row.entry_signal === 'long') {
      positions.push({
        time: row.entry_date,
        position: 'belowBar',
        color: '#2196F3',
        shape: 'arrowUp',
        text: 'Long Opened',
        entry_signal: row.entry_signal,
      });
      positions.push({
        time: row.exit_date,
        position: 'belowBar',
        color: '#2196F3',
        shape: 'arrowUp',
        text: 'Long Closed',
        quantity: row.quantity,
        result: row.result,
        entry_signal: row.entry_signal,
      });
    } else {
      positions.push({
        time: row.entry_date,
        position: 'aboveBar',
        color: '#e91e63',
        shape: 'arrowDown',
        text: 'Short Opened',
        entry_signal: row.entry_signal,
      });
      positions.push({
        time: row.exit_date,
        position: 'aboveBar',
        color: '#e91e63',
        shape: 'arrowDown',
        text: 'Short Closed',
        quantity: row.quantity,
        result: row.result,
        entry_signal: row.entry_signal,
      });
    }
  }

  positionsMap.set(strategy, positions);
  return positions.map((position) => ({
    ...position,
    time: Math.floor(dayjs(position.time).unix()),
  }));
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
      volume: parseFloat(r.volume),
    }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') ?? '';
  const strategy = searchParams.get('strategy') ?? '';
  const startDate = searchParams.get('startDate') ?? '2024-01-01 00:00:00';
  const marketData = readCSV(symbol, startDate);
  const positions = await queryFromJSON(strategy);
  return NextResponse.json({
    marketData: marketData,
    positions: positions,
  });
}
