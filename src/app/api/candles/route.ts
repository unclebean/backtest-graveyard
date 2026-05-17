import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
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

async function initialLoadPositions(strategy: string) {
  const db = await open({
    filename: path.join(process.cwd(), 'db/konjac2.db'),
    driver: sqlite3.Database,
  });

  const rows = await db.all(
    `SELECT *
         FROM trade
         WHERE strategy = '${strategy}'
         AND entry_date is not null 
         AND exit_date is not null
         ORDER BY entry_date ASC`,
  );

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
  return positions;
}

// Use SQLite from local file
async function queryFromSQLite(strategy: string) {
  let positions = positionsMap.get(strategy);
  if (!positions || positions?.length === 0) {
    positions = await initialLoadPositions(strategy);
  }

  return positions?.map((position) => ({
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
  const positions = await queryFromSQLite(strategy);
  return NextResponse.json({
    marketData: marketData,
    positions: positions,
  });
}
