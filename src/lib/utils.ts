import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const FOREX_SYMBOLS = ['EUR'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isForex(symbol: string) {
  return FOREX_SYMBOLS.includes(symbol);
}
