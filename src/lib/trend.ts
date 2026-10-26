import type { StatTrend } from '../types/jl-stat.types';

// The typographic minus (U+2212), which figures often use instead of the hyphen.
const MINUS_SIGN = '−';
// A delta reads as "+12.5%", "-3", "−0.4 pt" or "0%": an optional sign, then the first number.
const SIGNED_NUMBER = /^\s*([+\-−])?\D*([\d.,]+)?/;
const SIGN_TRENDS: Record<string, StatTrend> = { '-': 'down', '+': 'up', [MINUS_SIGN]: 'down' };

/** Which way a delta written as text went: a plus is up, a minus is down, zero or no sign is flat. */
export function trendOfDelta(delta: string): StatTrend {
  const [, sign = '', digits = ''] = SIGNED_NUMBER.exec(delta) ?? [];
  const amount = Number.parseFloat(digits.replace(/,/g, ''));
  if (amount === 0) {
    return 'flat';
  }
  return SIGN_TRENDS[sign] ?? 'flat';
}
