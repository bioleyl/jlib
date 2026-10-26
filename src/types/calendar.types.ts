/** A day on the calendar, without a time or a time zone: what an ISO date (`yyyy-mm-dd`) names. */
export type CalendarDate = {
  year: number;
  /** 1 for January to 12 for December. */
  month: number;
  day: number;
};

/** A day of the week, counted as `Date#getDay` does: 0 is Sunday, 1 is Monday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** How long the name of a weekday is: `Monday`, `Mon` or `M`. */
export type WeekdayWidth = 'long' | 'short' | 'narrow';

/** A part of a date as it is written: the day, the month or the year. */
export type DatePart = 'day' | 'month' | 'year';
