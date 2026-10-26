// Times and durations as people read them, in their language: "3 mins", "2 hrs 10 mins", "5 minutes ago",
// "yesterday", "12 Mar". Pure: the moment to count from is given.

const SECOND_MS = 1000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINUTE_S = 60;
const HOUR_S = MINUTES_PER_HOUR * MINUTE_S;
const DAY_S = HOURS_PER_DAY * HOUR_S;
// Under these, a time is said in the smaller unit: 44 seconds is "now", 44 minutes is "44 minutes ago"; within a
// week, by the day.
const NOW_UNDER_S = 45;
const MINUTES_UNDER_S = 45 * MINUTE_S;
const DAYS_UNDER = 7;

type DurationUnit = 'second' | 'minute' | 'hour' | 'day';

/** A number of one unit, as the language writes it short: "33 secs", "3 min", "2 Std.". */
const unitText = (value: number, unit: DurationUnit, locale: string | undefined): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0, style: 'unit', unit, unitDisplay: 'short' }).format(
    value
  );

/** Two units side by side, the second left out at zero: "2 hrs 10 mins", "3 days". */
function pair(first: [number, DurationUnit], second: [number, DurationUnit], locale: string | undefined): string {
  const parts = [unitText(first[0], first[1], locale)];
  if (second[0] > 0) {
    parts.push(unitText(second[0], second[1], locale));
  }
  return new Intl.ListFormat(locale, { style: 'narrow', type: 'unit' }).format(parts);
}

/**
 * A duration in the units that read best: "< 1 sec" under a second (never "0.0 s"), then seconds, minutes, hours
 * and minutes, days and hours. The unit is chosen once rounded: 59.6 seconds is "1 min", not "60 secs". Not a
 * number gives "".
 */
export function formatDuration(milliseconds: number, locale?: string): string {
  if (!Number.isFinite(milliseconds)) {
    return '';
  }
  const seconds = Math.max(0, milliseconds) / SECOND_MS;
  if (seconds < 1) {
    return `< ${unitText(1, 'second', locale)}`;
  }
  const wholeSeconds = Math.round(seconds);
  if (wholeSeconds < MINUTE_S) {
    return unitText(wholeSeconds, 'second', locale);
  }
  const minutes = Math.round(seconds / MINUTE_S);
  if (minutes < MINUTES_PER_HOUR) {
    return unitText(minutes, 'minute', locale);
  }
  if (minutes < MINUTES_PER_HOUR * HOURS_PER_DAY) {
    return pair([Math.floor(minutes / MINUTES_PER_HOUR), 'hour'], [minutes % MINUTES_PER_HOUR, 'minute'], locale);
  }
  const hours = Math.round(seconds / HOUR_S);
  return pair([Math.floor(hours / HOURS_PER_DAY), 'day'], [hours % HOURS_PER_DAY, 'hour'], locale);
}

/** Midnight of a date's day, in the reader's time zone. */
const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** How many days on the calendar from `now` to `then`: -1 is yesterday, whatever the hours. */
const calendarDays = (then: Date, now: Date): number =>
  Math.round((startOfDay(then) - startOfDay(now)) / (DAY_S * SECOND_MS));

/**
 * When something happened, from `now`: "now", "5 minutes ago", "3 hours ago" the same day, "yesterday" or "3 days
 * ago" by the calendar within a week, then the date ("12 Mar", with the year when it is not this year's). Times to
 * come read the same way: "in 5 minutes". A date that is not one gives "".
 */
export function formatRelativeTime(date: Date | number | string, now: Date | number, locale?: string): string {
  const then = new Date(date);
  const today = new Date(now);
  if (Number.isNaN(then.getTime()) || Number.isNaN(today.getTime())) {
    return '';
  }
  const seconds = (then.getTime() - today.getTime()) / SECOND_MS;
  const distance = Math.abs(seconds);
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (distance < NOW_UNDER_S) {
    return relative.format(0, 'second');
  }
  if (distance < MINUTES_UNDER_S) {
    return relative.format(Math.round(seconds / MINUTE_S), 'minute');
  }
  const days = calendarDays(then, today);
  if (days === 0) {
    return relative.format(Math.round(seconds / HOUR_S), 'hour');
  }
  if (Math.abs(days) < DAYS_UNDER) {
    return relative.format(days, 'day');
  }
  const sameYear = then.getFullYear() === today.getFullYear();
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(then);
}
