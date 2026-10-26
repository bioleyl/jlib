import { describe, expect, it } from 'vitest';

import { formatDuration, formatRelativeTime } from '../src/lib/time';

const EN = 'en-GB';
const FR = 'fr-CH';
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = new Date(2026, 9, 26, 15, 0, 0);

// French separates a number from its unit with a narrow no-break space: compare the words, not the spaces.
const spaced = (text: string): string => text.replace(/\s/gu, ' ');

describe('formatDuration', () => {
  it('never says zero: under a second is "< 1 sec"', () => {
    expect(formatDuration(0, EN)).toBe('< 1 sec');
    expect(formatDuration(400, EN)).toBe('< 1 sec');
  });

  it('counts seconds, then minutes', () => {
    expect(formatDuration(33 * SECOND, EN)).toBe('33 secs');
    expect(formatDuration(3 * MINUTE + 10 * SECOND, EN)).toBe('3 mins');
  });

  it('says hours with their minutes, and days with their hours', () => {
    expect(formatDuration(2 * HOUR + 10 * MINUTE, EN)).toBe('2 hrs 10 mins');
    expect(formatDuration(2 * HOUR, EN)).toBe('2 hrs');
    expect(formatDuration(3 * DAY + 4 * HOUR, EN)).toBe('3 days 4 hrs');
  });

  it("writes the reader's language", () => {
    expect(spaced(formatDuration(33 * SECOND, FR))).toBe('33 s');
    expect(spaced(formatDuration(3 * MINUTE, FR))).toBe('3 min');
  });

  it('reads a negative duration as none', () => {
    expect(formatDuration(-5 * SECOND, EN)).toBe('< 1 sec');
  });
});

describe('formatRelativeTime', () => {
  const ago = (milliseconds: number): Date => new Date(NOW.getTime() - milliseconds);

  it('says "now" under 45 seconds', () => {
    expect(formatRelativeTime(ago(20 * SECOND), NOW, EN)).toBe('now');
  });

  it('counts minutes, hours, then days', () => {
    expect(formatRelativeTime(ago(5 * MINUTE), NOW, EN)).toBe('5 minutes ago');
    expect(formatRelativeTime(ago(3 * HOUR), NOW, EN)).toBe('3 hours ago');
    expect(formatRelativeTime(ago(DAY), NOW, EN)).toBe('yesterday');
    expect(formatRelativeTime(ago(4 * DAY), NOW, EN)).toBe('4 days ago');
  });

  it('gives the date after a week, with the year only when it is another', () => {
    expect(formatRelativeTime(new Date(2026, 2, 12), NOW, EN)).toBe('12 Mar');
    expect(formatRelativeTime(new Date(2025, 2, 12), NOW, EN)).toBe('12 Mar 2025');
  });

  it('reads times to come too, and ISO strings', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + 5 * MINUTE).toISOString(), NOW, EN)).toBe('in 5 minutes');
  });

  it("writes the reader's language", () => {
    expect(formatRelativeTime(ago(DAY), NOW, FR)).toBe('hier');
  });
});
