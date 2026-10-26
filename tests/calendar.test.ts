import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDates,
  dateAfterKey,
  dateOrder,
  datePattern,
  dayOfWeek,
  daysInMonth,
  endOfWeek,
  formatDate,
  formatMonthTitle,
  isDateText,
  isWithin,
  monthGrid,
  monthHasDaysWithin,
  NUMERIC_DATE,
  parseIsoDate,
  parseTypedDate,
  startOfWeek,
  toIsoDate,
  weekdayNames,
  weekdayOrder,
} from '../src/lib/calendar';

const date = (iso: string) => {
  const parsed = parseIsoDate(iso);
  if (parsed === null) {
    throw new Error(`Bad date in a test: ${iso}`);
  }
  return parsed;
};

const MONDAY = 1;
const SUNDAY = 0;

describe('parseIsoDate and toIsoDate', () => {
  it('reads an ISO date into its year, month and day', () => {
    expect(parseIsoDate('2026-10-25')).toEqual({ day: 25, month: 10, year: 2026 });
  });

  it('refuses other formats and days that do not exist', () => {
    expect(parseIsoDate('2026-1-5')).toBeNull();
    expect(parseIsoDate('25/10/2026')).toBeNull();
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-00-10')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });

  it('knows the 29th of February of leap years only', () => {
    expect(parseIsoDate('2024-02-29')).not.toBeNull();
    expect(parseIsoDate('2023-02-29')).toBeNull();
    expect(parseIsoDate('1900-02-29')).toBeNull();
    expect(parseIsoDate('2000-02-29')).not.toBeNull();
  });

  it('writes dates back with padded numbers', () => {
    expect(toIsoDate({ day: 5, month: 3, year: 2026 })).toBe('2026-03-05');
    expect(toIsoDate({ day: 1, month: 1, year: 33 })).toBe('0033-01-01');
  });
});

describe('date arithmetic', () => {
  it('counts the days of each month', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it('adds days across months, years and daylight-saving changes', () => {
    expect(toIsoDate(addDays(date('2026-10-25'), 1))).toBe('2026-10-26');
    expect(toIsoDate(addDays(date('2026-03-29'), 1))).toBe('2026-03-30');
    expect(toIsoDate(addDays(date('2026-12-31'), 1))).toBe('2027-01-01');
    expect(toIsoDate(addDays(date('2026-03-01'), -1))).toBe('2026-02-28');
    expect(toIsoDate(addDays(date('2024-02-28'), 1))).toBe('2024-02-29');
  });

  it('adds months keeping the day, or the last day of a shorter month', () => {
    expect(toIsoDate(addMonths(date('2026-01-31'), 1))).toBe('2026-02-28');
    expect(toIsoDate(addMonths(date('2026-03-15'), -3))).toBe('2025-12-15');
    expect(toIsoDate(addMonths(date('2026-12-10'), 1))).toBe('2027-01-10');
    expect(toIsoDate(addYears(date('2024-02-29'), 1))).toBe('2025-02-28');
  });

  it('knows the weekday of a date', () => {
    expect(dayOfWeek(date('2026-10-25'))).toBe(0);
    expect(dayOfWeek(date('2026-10-26'))).toBe(1);
    expect(dayOfWeek(date('2000-01-01'))).toBe(6);
  });

  it('compares and bounds dates', () => {
    expect(compareDates(date('2026-10-25'), date('2026-10-26'))).toBeLessThan(0);
    expect(compareDates(date('2027-01-01'), date('2026-12-31'))).toBeGreaterThan(0);
    expect(compareDates(date('2026-10-25'), date('2026-10-25'))).toBe(0);
    expect(isWithin(date('2026-10-25'), date('2026-10-01'), date('2026-10-31'))).toBe(true);
    expect(isWithin(date('2026-11-01'), date('2026-10-01'), date('2026-10-31'))).toBe(false);
    expect(isWithin(date('2026-11-01'), null, null)).toBe(true);
    expect(toIsoDate(clampDate(date('2026-09-15'), date('2026-10-01'), null))).toBe('2026-10-01');
    expect(toIsoDate(clampDate(date('2026-12-15'), null, date('2026-10-31')))).toBe('2026-10-31');
  });
});

describe('weeks and month grids', () => {
  it('orders the weekdays from the first day of the week', () => {
    expect(weekdayOrder(MONDAY)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekdayOrder(SUNDAY)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('finds the start and the end of a week', () => {
    expect(toIsoDate(startOfWeek(date('2026-10-25'), MONDAY))).toBe('2026-10-19');
    expect(toIsoDate(endOfWeek(date('2026-10-25'), MONDAY))).toBe('2026-10-25');
    expect(toIsoDate(startOfWeek(date('2026-10-25'), SUNDAY))).toBe('2026-10-25');
    expect(toIsoDate(endOfWeek(date('2026-10-21'), SUNDAY))).toBe('2026-10-24');
  });

  it('lays a month out in six weeks starting on the first day of the week', () => {
    const grid = monthGrid(2026, 10, MONDAY);
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(toIsoDate(grid[0]?.[0] ?? date('2000-01-01'))).toBe('2026-09-28');
    expect(toIsoDate(grid[5]?.[6] ?? date('2000-01-01'))).toBe('2026-11-08');
  });

  it('starts a month that begins on the first day of the week on that very day', () => {
    const grid = monthGrid(2026, 6, MONDAY);
    expect(toIsoDate(grid[0]?.[0] ?? date('2000-01-01'))).toBe('2026-06-01');
  });

  it('tells whether a month has days within bounds', () => {
    expect(monthHasDaysWithin(2026, 9, date('2026-09-30'), null)).toBe(true);
    expect(monthHasDaysWithin(2026, 9, date('2026-10-01'), null)).toBe(false);
    expect(monthHasDaysWithin(2026, 11, null, date('2026-10-31'))).toBe(false);
  });
});

describe('dateAfterKey', () => {
  const start = date('2026-10-21');

  it('moves by day and week with the arrows', () => {
    expect(toIsoDate(dateAfterKey(start, 'ArrowRight', MONDAY) ?? start)).toBe('2026-10-22');
    expect(toIsoDate(dateAfterKey(start, 'ArrowLeft', MONDAY) ?? start)).toBe('2026-10-20');
    expect(toIsoDate(dateAfterKey(start, 'ArrowDown', MONDAY) ?? start)).toBe('2026-10-28');
    expect(toIsoDate(dateAfterKey(start, 'ArrowUp', MONDAY) ?? start)).toBe('2026-10-14');
  });

  it('goes to the ends of the week, and by month or year with the page keys', () => {
    expect(toIsoDate(dateAfterKey(start, 'Home', MONDAY) ?? start)).toBe('2026-10-19');
    expect(toIsoDate(dateAfterKey(start, 'End', MONDAY) ?? start)).toBe('2026-10-25');
    expect(toIsoDate(dateAfterKey(start, 'PageDown', MONDAY) ?? start)).toBe('2026-11-21');
    expect(toIsoDate(dateAfterKey(start, 'PageUp', MONDAY, true) ?? start)).toBe('2025-10-21');
  });

  it('ignores other keys', () => {
    expect(dateAfterKey(start, 'a', MONDAY)).toBeNull();
  });
});

describe('formatting', () => {
  it('names months and weekdays in the locale', () => {
    expect(formatMonthTitle(2026, 10, 'en-US')).toBe('October 2026');
    expect(formatMonthTitle(2026, 10, 'fr-CH')).toBe('octobre 2026');
    expect(weekdayNames('en-US', MONDAY, 'short')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(weekdayNames('en-US', SUNDAY, 'long')[0]).toBe('Sunday');
  });

  it('writes a date for people, whatever the time zone', () => {
    expect(formatDate(date('2026-10-25'), 'en-US')).toBe('Oct 25, 2026');
    expect(formatDate(date('2026-01-01'), 'en-US', { dateStyle: 'full' })).toBe('Thursday, January 1, 2026');
  });
});

describe('typed dates', () => {
  const october25 = { day: 25, month: 10, year: 2026 };
  const swiss = dateOrder('de-CH');
  const american = dateOrder('en-US');

  it('knows the order and the pattern each locale types dates in', () => {
    expect(swiss).toEqual(['day', 'month', 'year']);
    expect(american).toEqual(['month', 'day', 'year']);
    expect(dateOrder('ja-JP')).toEqual(['year', 'month', 'day']);
    expect(datePattern('de-CH')).toBe('dd.mm.yyyy');
    expect(datePattern('en-US')).toBe('mm/dd/yyyy');
    expect(datePattern('fr-FR')).toBe('dd/mm/yyyy');
  });

  it('writes a date in digits, in the locale order, with western digits everywhere', () => {
    expect(formatDate(october25, 'de-CH', NUMERIC_DATE)).toBe('25.10.2026');
    expect(formatDate(october25, 'en-US', NUMERIC_DATE)).toBe('10/25/2026');
    expect(formatDate(october25, 'ar-EG', NUMERIC_DATE)).toMatch(/25.*10.*2026|2026.*10.*25/);
  });

  it('reads a date typed in the locale order, with any separators', () => {
    expect(parseTypedDate('25.10.2026', swiss)).toEqual(october25);
    expect(parseTypedDate('25/10/2026', swiss)).toEqual(october25);
    expect(parseTypedDate(' 25 10 2026 ', swiss)).toEqual(october25);
    expect(parseTypedDate('5.3.2026', swiss)).toEqual({ day: 5, month: 3, year: 2026 });
    expect(parseTypedDate('10/25/2026', american)).toEqual(october25);
  });

  it('reads its digits alone, and the year first whatever the locale', () => {
    expect(parseTypedDate('25102026', swiss)).toEqual(october25);
    expect(parseTypedDate('10252026', american)).toEqual(october25);
    expect(parseTypedDate('2026-10-25', swiss)).toEqual(october25);
    expect(parseTypedDate('2026/10/25', american)).toEqual(october25);
  });

  it('refuses letters, short years, missing parts and days that do not exist', () => {
    expect(parseTypedDate('Hllb', swiss)).toBeNull();
    expect(parseTypedDate('25 oct 2026', swiss)).toBeNull();
    expect(parseTypedDate('25.10.26', swiss)).toBeNull();
    expect(parseTypedDate('25.10', swiss)).toBeNull();
    expect(parseTypedDate('2510202', swiss)).toBeNull();
    expect(parseTypedDate('31.02.2026', swiss)).toBeNull();
    expect(parseTypedDate('', swiss)).toBeNull();
  });

  it('lets digits and separators be typed, not letters', () => {
    expect(isDateText('25.10.2026')).toBe(true);
    expect(isDateText('2026-10-25')).toBe(true);
    expect(isDateText('a')).toBe(false);
    expect(isDateText('25 oct')).toBe(false);
  });
});
