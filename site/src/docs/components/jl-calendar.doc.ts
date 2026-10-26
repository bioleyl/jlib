import { addDays, calendarDateOf, formatDate, parseIsoDate, toIsoDate } from '@syware/jlib/lib/calendar';

import type { JlCalendar } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

// The examples are about the weeks around today, so they stay meaningful whenever the page is read.
const TODAY = calendarDateOf(new Date());
const BOOKING_WINDOW_DAYS = 30;
const IN_A_WEEK = 7;
const MIN = toIsoDate(TODAY);
const MAX = toIsoDate(addDays(TODAY, BOOKING_WINDOW_DAYS));
const SELECTED = toIsoDate(addDays(TODAY, IN_A_WEEK));

export const doc: ComponentDoc = {
  className: 'JlCalendar',
  description: `A month to pick a day from. Today is marked, days of the next and previous months are muted, and days
outside min and max cannot be chosen. The header's arrows turn the page; they stop where nothing could be chosen.

From the keyboard it is a grid: the arrows move by day and week, Page Up and Page Down by month (Shift for a year),
Home and End go to the ends of the week, Enter or Space chooses. Month and weekday names come from Intl in the
locale (the page's language by default); first-day sets the day weeks start on. Dates are ISO texts
(2026-10-25) worked on as plain years, months and days, so no time zone can shift them.`,
  events: [
    { description: 'The chosen day changed.', detail: 'string', name: 'change' },
    { description: 'A day was chosen, even the one already chosen.', detail: 'string', name: 'pick' },
  ],
  examples: [
    {
      description: 'Names and the first day of the week follow the locale and first-day.',
      html: `
        <div class="row" style="align-items: start">
          <jl-calendar locale="en-US" first-day="0" value="${SELECTED}"></jl-calendar>
          <jl-calendar locale="fr-CH" value="${SELECTED}"></jl-calendar>
          <jl-calendar locale="de-CH" value="${SELECTED}" size="sm"></jl-calendar>
        </div>`,
      title: 'Locales',
    },
    {
      description: 'Bookings open for the next 30 days: other days are struck out and cannot be chosen.',
      html: `<jl-calendar min="${MIN}" max="${MAX}" value="${SELECTED}" label="Delivery day"></jl-calendar>`,
      title: 'Within bounds',
    },
    {
      description: 'The sentence listens to change.',
      html: `
        <div class="stack">
          <jl-calendar class="demo-day" label="Meeting day"></jl-calendar>
          <p class="muted demo-day-out">Pick a day.</p>
        </div>`,
      script: `
        const calendar = root.querySelector('.demo-day');
        const out = root.querySelector('.demo-day-out');
        calendar.events.register('change', (iso) => {
          out.textContent = \`Meeting on \${iso}.\`;
        });`,
      setup: (root) => {
        const calendar = root.querySelector<JlCalendar>('.demo-day');
        const out = root.querySelector('.demo-day-out');
        calendar?.events.register('change', (iso) => {
          const date = parseIsoDate(iso);
          if (out !== null && date !== null) {
            out.textContent = `Meeting on ${formatDate(date, undefined, { dateStyle: 'full' })} (${iso}).`;
          }
        });
      },
      title: 'Listening',
    },
    {
      html: `
        <div class="row" style="align-items: start">
          <jl-calendar size="lg" value="${SELECTED}"></jl-calendar>
          <jl-calendar disabled value="${SELECTED}"></jl-calendar>
        </div>`,
      title: 'Large, and disabled',
    },
  ],
  level: 'molecule',
  methods: [
    {
      description:
        'Focuses the day the arrows move from: the chosen one, else today, else the first of the month.',
      name: 'focus',
      signature: 'focus(options?: FocusOptions): void',
    },
    {
      description: 'Shows the month of a date, without choosing it.',
      name: 'showMonth',
      signature: 'showMonth(iso: string): void',
    },
    {
      description: 'Whether a required calendar has a day.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Calendar',
  playground: { attributes: { value: SELECTED } },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The chosen day, as ISO (yyyy-mm-dd).',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'min',
      control: { kind: 'text' },
      default: "''",
      description: 'The first day that can be chosen, as ISO.',
      name: 'min',
      type: 'string',
    },
    {
      attribute: 'max',
      control: { kind: 'text' },
      default: "''",
      description: 'The last day that can be chosen, as ISO.',
      name: 'max',
      type: 'string',
    },
    {
      attribute: 'first-day',
      control: { kind: 'select', options: ['0', '1', '6'] },
      default: '1',
      description: 'The day weeks start on: 0 for Sunday, 1 for Monday, up to 6 for Saturday.',
      name: 'firstDay',
      type: '0 | 1 | 2 | 3 | 4 | 5 | 6',
    },
    {
      attribute: 'locale',
      control: { kind: 'text' },
      default: "''",
      description: "The language of the names, such as fr-CH; the page's language when empty.",
      name: 'locale',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The days: 32, 36 or 42 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data.",
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'label',
      default: "''",
      description: "The calendar's name for screen readers; the month's title names it otherwise.",
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The form cannot be submitted without a day.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Shows the month, but nothing can be chosen.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'invalid',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The frame in the danger colour, for an error the page found.',
      name: 'invalid',
      type: 'boolean',
    },
  ],
  styling: [
    { description: 'The size of a day, set by size; any length works.', name: '--cell' },
    { description: 'The frame around the header and the grid.', name: 'base' },
  ],
  summary: 'A month grid to pick a day, in any locale, from the pointer or the keyboard.',
  tag: 'jl-calendar',
};
