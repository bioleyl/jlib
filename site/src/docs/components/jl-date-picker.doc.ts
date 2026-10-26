import { addDays, calendarDateOf, parseIsoDate, toIsoDate } from '@syware/jlib/lib/calendar';

import type { JlDatePicker } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const TODAY = calendarDateOf(new Date());
const IN_A_WEEK = 7;
const STAY_NIGHTS = 3;
const MIN = toIsoDate(TODAY);
const CHECK_IN = toIsoDate(addDays(TODAY, IN_A_WEEK));
const CHECK_OUT = toIsoDate(addDays(TODAY, IN_A_WEEK + STAY_NIGHTS));

const DESTINATIONS = JSON.stringify([
  { description: 'Lake Geneva, Switzerland', label: 'Montreux', value: 'montreux' },
  { description: 'Bernese Oberland, Switzerland', label: 'Grindelwald', value: 'grindelwald' },
  { description: 'Ticino, Switzerland', label: 'Lugano', value: 'lugano' },
  { description: 'Valais, Switzerland', label: 'Zermatt', value: 'zermatt' },
  { description: 'Graubünden, Switzerland', label: 'St. Moritz', value: 'st-moritz' },
]);

/** The next day of an ISO date, as ISO; empty for an empty or unreadable one. */
function dayAfter(iso: string): string {
  const date = parseIsoDate(iso);
  return date === null ? '' : toIsoDate(addDays(date, 1));
}

/** A form's data as text, with the fields that repeat (the guests) as lists. */
function describeForm(form: HTMLFormElement): string {
  const data = new FormData(form);
  const keys = [...new Set(data.keys())];
  const entries = keys.map((key) => {
    const values = data.getAll(key);
    return [key, values.length === 1 ? values[0] : values];
  });
  return JSON.stringify(Object.fromEntries(entries));
}

export const doc: ComponentDoc = {
  className: 'JlDatePicker',
  description: `A field for a date. It shows the date written for people in the locale ("Oct 25, 2026", "25 oct.
2026"), and its button opens a jl-calendar in a popover; Down (or Alt + Down) in the field opens it too, Escape or
a click outside closes it. People who know the date may type it as ISO (2026-10-25): leaving the field or Enter
takes it, and unreadable text goes back to the date there was.

value and the form hold the ISO date. min and max limit the calendar; a typed date outside them makes the field
invalid, as a native date field would. Listen to change.`,
  events: [
    {
      description: 'A date was picked, typed or cleared: the ISO date, or an empty text.',
      detail: 'string',
      name: 'change',
    },
  ],
  examples: [
    {
      description: 'The same date, written in three locales.',
      html: `
        <div class="stack narrow">
          <jl-date-picker label="Date (English)" locale="en-GB" value="${CHECK_IN}"></jl-date-picker>
          <jl-date-picker label="Date (French)" locale="fr-CH" value="${CHECK_IN}"></jl-date-picker>
          <jl-date-picker label="Date (German)" locale="de-DE" value="${CHECK_IN}" clearable></jl-date-picker>
        </div>`,
      title: 'Locales',
    },
    {
      description:
        'A destination from a combobox, the stay from two date pickers (check-out starts the day after check-in), and the guests in a tag input. Submit to see the form data.',
      html: `
        <form class="stack narrow demo-booking">
          <jl-field label="Destination" required>
            <jl-combobox name="destination" placeholder="Where to?" required options='${DESTINATIONS}'></jl-combobox>
          </jl-field>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
            <jl-field label="Check-in" required>
              <jl-date-picker class="demo-check-in" name="check-in" min="${MIN}" value="${CHECK_IN}" required></jl-date-picker>
            </jl-field>
            <jl-field label="Check-out" required>
              <jl-date-picker class="demo-check-out" name="check-out" min="${dayAfter(CHECK_IN)}" value="${CHECK_OUT}" required></jl-date-picker>
            </jl-field>
          </div>
          <jl-field label="Guests" hint="Email addresses: each guest gets the confirmation.">
            <jl-tag-input name="guests" placeholder="name@example.com"></jl-tag-input>
          </jl-field>
          <div class="row">
            <jl-button type="submit" variant="primary" label="Check availability"></jl-button>
          </div>
          <p class="muted demo-booking-out">Nothing sent yet.</p>
        </form>`,
      script: `
        // dayAfter(iso): the next day, as ISO. describeForm(form): the form data as JSON.
        const form = root.querySelector('.demo-booking');
        const checkIn = root.querySelector('.demo-check-in');
        const checkOut = root.querySelector('.demo-check-out');
        checkIn.events.register('change', (iso) => {
          checkOut.min.set(dayAfter(iso));
          if (checkOut.value.get() <= iso) {
            checkOut.value.set('');
          }
        });
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          root.querySelector('.demo-booking-out').textContent = describeForm(form);
        });`,
      setup: (root) => {
        const form = root.querySelector<HTMLFormElement>('.demo-booking');
        const checkIn = root.querySelector<JlDatePicker>('.demo-check-in');
        const checkOut = root.querySelector<JlDatePicker>('.demo-check-out');
        const out = root.querySelector('.demo-booking-out');
        checkIn?.events.register('change', (iso) => {
          checkOut?.min.set(dayAfter(iso));
          if (checkOut !== null && checkOut.value.get() <= iso) {
            checkOut.value.set('');
          }
        });
        form?.addEventListener('submit', (event) => {
          event.preventDefault();
          if (out !== null) {
            out.textContent = describeForm(form);
          }
        });
      },
      title: 'Booking form',
    },
    {
      description: 'The sentence listens to change; type 2030-01-01 in the field and press Enter.',
      html: `
        <div class="stack narrow">
          <jl-date-picker class="demo-due" label="Due date" placeholder="yyyy-mm-dd" clearable></jl-date-picker>
          <p class="muted demo-due-out">No due date.</p>
        </div>`,
      script: `
        const picker = root.querySelector('.demo-due');
        const out = root.querySelector('.demo-due-out');
        picker.events.register('change', (iso) => {
          out.textContent = iso === '' ? 'No due date.' : \`Due on \${iso}.\`;
        });`,
      setup: (root) => {
        const picker = root.querySelector<JlDatePicker>('.demo-due');
        const out = root.querySelector('.demo-due-out');
        picker?.events.register('change', (iso) => {
          if (out !== null) {
            out.textContent = iso === '' ? 'No due date.' : `Due on ${iso}.`;
          }
        });
      },
      title: 'Typing and listening',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-date-picker size="sm" label="Small" placeholder="Small"></jl-date-picker>
          <jl-date-picker size="lg" label="Large" value="${CHECK_IN}"></jl-date-picker>
          <jl-date-picker label="Disabled" value="${CHECK_IN}" disabled></jl-date-picker>
          <jl-date-picker label="Invalid" placeholder="Required" invalid></jl-date-picker>
        </div>`,
      title: 'Sizes and states',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Opens the calendar, with the focus on its day.', name: 'show', signature: 'show(): void' },
    { description: 'Closes the calendar.', name: 'hide', signature: 'hide(): void' },
    { description: 'Focuses the text field.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether the date is there when required, and within min and max.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'Date picker',
  playground: {
    attributes: { clearable: true, label: 'Date', placeholder: 'Pick a date' },
    height: 420,
  },
  props: [
    {
      attribute: 'value',
      control: { kind: 'text' },
      default: "''",
      description: 'The date, as ISO (yyyy-mm-dd); empty for none.',
      name: 'value',
      type: 'string',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'Shown while there is no date.',
      name: 'placeholder',
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
      attribute: 'locale',
      control: { kind: 'text' },
      default: "''",
      description: "The language of the date and the calendar, such as fr-CH; the page's when empty.",
      name: 'locale',
      type: 'string',
    },
    {
      attribute: 'first-day',
      control: { kind: 'select', options: ['0', '1', '6'] },
      default: '1',
      description: "The day the calendar's weeks start on: 0 for Sunday, 1 for Monday.",
      name: 'firstDay',
      type: '0 | 1 | 2 | 3 | 4 | 5 | 6',
    },
    {
      attribute: 'clearable',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'A button empties the field while it holds a date.',
      name: 'clearable',
      type: 'boolean',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'The height.',
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
      description: 'The accessible name, when no visible label names the field.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The form cannot be submitted without a date.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Cannot be changed or focused.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'invalid',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Drawn in the danger colour, for an error the page found.',
      name: 'invalid',
      type: 'boolean',
    },
  ],
  styling: [
    { description: 'The frame around the text field.', name: 'base' },
    { description: 'The popover that holds the calendar.', name: 'popup' },
  ],
  summary: 'A date field that shows the date for people and opens a calendar to pick it.',
  tag: 'jl-date-picker',
};
