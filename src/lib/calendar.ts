import type { CalendarDate, Weekday, WeekdayWidth } from '../types/calendar.types';

// Dates are plain years, months and days. The arithmetic runs on UTC timestamps, where every day lasts exactly a
// day: no time zone or daylight-saving change can move a date. ISO text is read with a pattern, never with Date().
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_WEEK = 7;
/** A month grid always has six weeks, so the calendar keeps its height from one month to the next. */
export const WEEKS_PER_GRID = 6;
const FEBRUARY = 2;
const LEAP_FEBRUARY_DAYS = 29;
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const YEAR_DIGITS = 4;
const MONTH_DIGITS = 2;
// A week that starts on a Sunday, to name the weekdays: 2023-01-01 was one.
const A_SUNDAY: CalendarDate = { day: 1, month: 1, year: 2023 };
const UTC = 'UTC';

export const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function daysInMonth(year: number, month: number): number {
  if (month === FEBRUARY && isLeapYear(year)) {
    return LEAP_FEBRUARY_DAYS;
  }
  return MONTH_LENGTHS[month - 1] ?? 0;
}

/** A date from its ISO text (`2026-10-25`); null for anything else, including days that do not exist. */
export function parseIsoDate(text: string): CalendarDate | null {
  const match = ISO_DATE.exec(text.trim());
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > MONTHS_PER_YEAR || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { day, month, year };
}

const pad = (value: number, digits: number): string => String(value).padStart(digits, '0');

export const toIsoDate = (date: CalendarDate): string =>
  `${pad(date.year, YEAR_DIGITS)}-${pad(date.month, MONTH_DIGITS)}-${pad(date.day, MONTH_DIGITS)}`;

/** The date's midnight in UTC. `setUTCFullYear` keeps years under 100 as they are, where `Date.UTC` would not. */
function utcTime(date: CalendarDate): number {
  const time = new Date(0);
  time.setUTCFullYear(date.year, date.month - 1, date.day);
  return time.getTime();
}

function fromUtcTime(time: number): CalendarDate {
  const moment = new Date(time);
  return { day: moment.getUTCDate(), month: moment.getUTCMonth() + 1, year: moment.getUTCFullYear() };
}

/** Today, or the day of any moment, as the person's clock shows it. */
export const calendarDateOf = (moment: Date): CalendarDate => ({
  day: moment.getDate(),
  month: moment.getMonth() + 1,
  year: moment.getFullYear(),
});

export const addDays = (date: CalendarDate, days: number): CalendarDate =>
  fromUtcTime(utcTime(date) + days * MS_PER_DAY);

/** The same day some months later or earlier; the 31st becomes the last day of a shorter month. */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const index = date.year * MONTHS_PER_YEAR + (date.month - 1) + months;
  const year = Math.floor(index / MONTHS_PER_YEAR);
  const month = index - year * MONTHS_PER_YEAR + 1;
  return { day: Math.min(date.day, daysInMonth(year, month)), month, year };
}

export const addYears = (date: CalendarDate, years: number): CalendarDate =>
  addMonths(date, years * MONTHS_PER_YEAR);

export const dayOfWeek = (date: CalendarDate): Weekday => new Date(utcTime(date)).getUTCDay() as Weekday;

/** Negative when a comes first, positive when b does, 0 for the same day. */
export const compareDates = (a: CalendarDate, b: CalendarDate): number =>
  a.year - b.year || a.month - b.month || a.day - b.day;

export const isSameDate = (a: CalendarDate | null, b: CalendarDate | null): boolean =>
  a !== null && b !== null && compareDates(a, b) === 0;

/** Whether the date is within the bounds, both included; a null bound does not limit. */
export const isWithin = (date: CalendarDate, min: CalendarDate | null, max: CalendarDate | null): boolean =>
  (min === null || compareDates(date, min) >= 0) && (max === null || compareDates(date, max) <= 0);

/** The nearest date within the bounds. */
export function clampDate(date: CalendarDate, min: CalendarDate | null, max: CalendarDate | null): CalendarDate {
  if (min !== null && compareDates(date, min) < 0) {
    return min;
  }
  if (max !== null && compareDates(date, max) > 0) {
    return max;
  }
  return date;
}

/** The weekdays in the order a week shows them, from its first day. */
export const weekdayOrder = (firstDay: Weekday): Weekday[] =>
  Array.from({ length: DAYS_PER_WEEK }, (_, index) => ((firstDay + index) % DAYS_PER_WEEK) as Weekday);

export const startOfWeek = (date: CalendarDate, firstDay: Weekday): CalendarDate =>
  addDays(date, -((dayOfWeek(date) - firstDay + DAYS_PER_WEEK) % DAYS_PER_WEEK));

export const endOfWeek = (date: CalendarDate, firstDay: Weekday): CalendarDate =>
  addDays(startOfWeek(date, firstDay), DAYS_PER_WEEK - 1);

export const startOfMonth = (date: CalendarDate): CalendarDate => ({ ...date, day: 1 });

export const isSameMonth = (a: CalendarDate, b: CalendarDate): boolean => a.year === b.year && a.month === b.month;

/** Six weeks of days around a month, starting on the week's first day: the days of a calendar page. */
export function monthGrid(year: number, month: number, firstDay: Weekday): CalendarDate[][] {
  const start = startOfWeek({ day: 1, month, year }, firstDay);
  return Array.from({ length: WEEKS_PER_GRID }, (_, week) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, day) => addDays(start, week * DAYS_PER_WEEK + day))
  );
}

/** Whether any day of the month is within the bounds: a month entirely outside them is not worth showing. */
export function monthHasDaysWithin(
  year: number,
  month: number,
  min: CalendarDate | null,
  max: CalendarDate | null
): boolean {
  const first = { day: 1, month, year };
  const last = { day: daysInMonth(year, month), month, year };
  return (max === null || compareDates(first, max) <= 0) && (min === null || compareDates(last, min) >= 0);
}

type DayMove = (date: CalendarDate, firstDay: Weekday, shift: boolean) => CalendarDate;

const DAY_MOVES = new Map<string, DayMove>([
  ['ArrowDown', (date) => addDays(date, DAYS_PER_WEEK)],
  ['ArrowLeft', (date) => addDays(date, -1)],
  ['ArrowRight', (date) => addDays(date, 1)],
  ['ArrowUp', (date) => addDays(date, -DAYS_PER_WEEK)],
  ['End', (date, firstDay) => endOfWeek(date, firstDay)],
  ['Home', (date, firstDay) => startOfWeek(date, firstDay)],
  ['PageDown', (date, _, shift) => (shift ? addYears(date, 1) : addMonths(date, 1))],
  ['PageUp', (date, _, shift) => (shift ? addYears(date, -1) : addMonths(date, -1))],
]);

/**
 * Where a key moves the focus of a date grid: arrows by day and week, Home and End to the ends of the week,
 * Page Up and Page Down by month (by year with Shift). Null for a key that does not move it.
 */
export function dateAfterKey(
  date: CalendarDate,
  key: string,
  firstDay: Weekday,
  shift = false
): CalendarDate | null {
  const move = DAY_MOVES.get(key);
  return move === undefined ? null : move(date, firstDay, shift);
}

/**
 * A function that writes dates for people, in a locale: `Oct 25, 2026` by default, any Intl date style with
 * `options`. Made once and used for many dates, as a calendar page does.
 */
export function dateFormatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): (date: CalendarDate) => string {
  const format = new Intl.DateTimeFormat(locale, { ...options, timeZone: UTC });
  return (date) => format.format(new Date(utcTime(date)));
}

/** One date written for people, in a locale: `Oct 25, 2026` by default. */
export const formatDate = (
  date: CalendarDate,
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions
): string => dateFormatter(locale, options)(date);

/** The title of a calendar page: `October 2026`. */
export const formatMonthTitle = (year: number, month: number, locale: string | undefined): string =>
  formatDate({ day: 1, month, year }, locale, { month: 'long', year: 'numeric' });

/** The names of the weekdays, in the order a week shows them from its first day. */
export const weekdayNames = (locale: string | undefined, firstDay: Weekday, width: WeekdayWidth): string[] =>
  weekdayOrder(firstDay).map((weekday) => formatDate(addDays(A_SUNDAY, weekday), locale, { weekday: width }));
