import { css } from '@jadis/core';
import { ChevronLeft, ChevronRight } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { clampedNumber, oneOf } from '../lib/attributes';
import {
  addMonths,
  calendarDateOf,
  clampDate,
  dateAfterKey,
  dateFormatter,
  formatMonthTitle,
  isSameDate,
  isSameMonth,
  isWithin,
  monthGrid,
  monthHasDaysWithin,
  parseIsoDate,
  toIsoDate,
  weekdayNames,
} from '../lib/calendar';
import { setOrRemove, uniqueId } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { pageLocale } from '../lib/locale';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-calendar.css?raw';

import type { CalendarDate, Weekday } from '../types/calendar.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight });

const NAV_ICON_SIZE = 16;
const MONDAY: Weekday = 1;
const SUNDAY: Weekday = 0;
const SATURDAY: Weekday = 6;
const SELECT_KEYS = ['Enter', ' '];
const FULL_DATE: Intl.DateTimeFormatOptions = { dateStyle: 'full' };

/** The first day of the week from its attribute: 0 (Sunday) to 6 (Saturday), Monday when absent. */
const parseWeekday = (value: string | null): Weekday =>
  Math.round(clampedNumber(MONDAY, SUNDAY, SATURDAY)(value)) as Weekday;

/** What a page of the calendar needs to draw its days. */
type PageContext = {
  focus: CalendarDate;
  label: (date: CalendarDate) => string;
  max: CalendarDate | null;
  min: CalendarDate | null;
  month: number;
  selected: CalendarDate | null;
  today: CalendarDate;
};

/**
 * A month to pick a day from. Arrows move by day and week, Page Up and Page Down by month (by year with Shift),
 * Home and End to the ends of the week, Enter chooses. Month and weekday names follow the `locale`; days outside
 * `min` and `max` cannot be chosen. `value` is an ISO date (`2026-10-25`).
 */
export class JlCalendar extends JlFormControl {
  static readonly selector = 'jl-calendar';

  /** `change` when the chosen day changes; `pick` each time a day is chosen, even the one already chosen. */
  readonly events = this.useEvents<{ change: string; pick: string }>();

  readonly value = this.useChange('', () => this.renderValue(), { attribute: 'value' });
  /** The first day that can be chosen, as an ISO date. */
  readonly min = this.useChange('', () => this.renderPage(), { attribute: 'min' });
  /** The last day that can be chosen, as an ISO date. */
  readonly max = this.useChange('', () => this.renderPage(), { attribute: 'max' });
  /** The day weeks start on: 0 for Sunday, 1 for Monday, up to 6 for Saturday. */
  readonly firstDay = this.useChange<Weekday>(MONDAY, () => this.renderPage(), {
    attribute: 'first-day',
    parse: parseWeekday,
  });
  /** The language of month and weekday names: `fr-CH`. The page's language by default. */
  readonly locale = this.useChange('', () => this.renderPage(), { attribute: 'locale' });
  /** The calendar's name for screen readers; the month's title names it otherwise. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.base, 'aria-label', value), {
    attribute: 'label',
  });
  readonly required = this.useChange(false, () => this.renderValidity(), { attribute: 'required' });
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** Draws the frame in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(false, (value) => this.reflect('invalid', value), { attribute: 'invalid' });
  /** The size of the days: 32, 36 or 42 pixels. */
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });

  private readonly _titleId = uniqueId('jl-calendar-title');

  /** The month shown, and the day the arrows move from (the one focusable cell of the grid). */
  private readonly _state = {
    focus: null as CalendarDate | null,
    formDisabled: false,
    view: calendarDateOf(new Date()),
  };

  private readonly _refs = this.useRefs((ref) => ({
    base: ref('.calendar'),
    days: ref('tbody'),
    grid: ref('table'),
    next: ref<HTMLButtonElement>('.next'),
    previous: ref<HTMLButtonElement>('.previous'),
    title: ref('.title'),
    weekdays: ref('thead tr'),
  }));

  /** Focuses the day the arrows move from: the chosen one, or today, or the first of the month. */
  override focus(options?: FocusOptions): void {
    this._refs.days.querySelector<HTMLElement>('[tabindex="0"]')?.focus(options);
  }

  /** Shows the month of a date (ISO), without choosing it. */
  showMonth(iso: string): void {
    const date = parseIsoDate(iso);
    if (date === null) {
      return;
    }
    this._state.view = date;
    this._state.focus = date;
    this.whenRendered(() => this.renderPage());
  }

  templateHtml(): Node {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset groups form fields; this is one widget with its header
      <div class="calendar" role="group" aria-labelledby={this._titleId} attrs={{ part: 'base' }}>
        <header>
          <button class="nav previous" type="button">
            <JlIcon name="chevron-left" size={NAV_ICON_SIZE} />
          </button>
          <div class="title" id={this._titleId} aria-live="polite" />
          <button class="nav next" type="button">
            <JlIcon name="chevron-right" size={NAV_ICON_SIZE} />
          </button>
        </header>
        {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: a table in the grid role is the ARIA date grid */}
        <table role="grid" aria-labelledby={this._titleId}>
          <thead>
            <tr />
          </thead>
          <tbody />
        </table>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  protected drawTexts(): void {
    this._refs.previous.setAttribute('aria-label', jlText('previousMonth'));
    this._refs.next.setAttribute('aria-label', jlText('nextMonth'));
    this.renderValidity();
  }

  onConnect(): void {
    this.on(this._refs.previous, 'click', () => this.turnPage(-1));
    this.on(this._refs.next, 'click', () => this.turnPage(1));
    this.on(this._refs.days, 'click', (event) => this.onDayClick(event));
    this.on(this._refs.days, 'keydown', (event) => this.onKey(event));
  }

  protected resetValue(): void {
    this.value.set(this.getAttribute('value') ?? '');
  }

  protected setDisabledByForm(disabled: boolean): void {
    this._state.formDisabled = disabled;
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => this.renderDisabled(this.disabled.get()));
  }

  private bounds(): { min: CalendarDate | null; max: CalendarDate | null } {
    return { max: parseIsoDate(this.max.get()), min: parseIsoDate(this.min.get()) };
  }

  private isOff(): boolean {
    return this.disabled.get() || this._state.formDisabled;
  }

  private onDayClick(event: MouseEvent): void {
    const cell = (event.target as Element).closest<HTMLElement>('[data-date]');
    const date = parseIsoDate(cell?.dataset.date ?? '');
    if (date !== null) {
      this.choose(date);
    }
  }

  private onKey(event: KeyboardEvent): void {
    const focus = this._state.focus;
    if (focus === null || this.isOff()) {
      return;
    }
    if (SELECT_KEYS.includes(event.key)) {
      event.preventDefault();
      this.choose(focus);
      return;
    }
    const next = dateAfterKey(focus, event.key, this.firstDay.get(), event.shiftKey);
    if (next === null) {
      return;
    }
    event.preventDefault();
    const { min, max } = this.bounds();
    this.moveFocus(clampDate(next, min, max));
  }

  /** Moves the focus to a day, turning the page when it is in another month. */
  private moveFocus(date: CalendarDate): void {
    const turn = !isSameMonth(date, this._state.view);
    this._state.focus = date;
    if (turn) {
      this._state.view = date;
      this.renderPage();
    } else {
      this.renderFocus();
    }
    this.focus();
  }

  private turnPage(months: number): void {
    const { min, max } = this.bounds();
    const view = addMonths({ ...this._state.view, day: 1 }, months);
    const focus = this._state.focus ?? view;
    this._state.view = view;
    this._state.focus = clampDate(addMonths(focus, months), min, max);
    this.renderPage();
  }

  private choose(date: CalendarDate): void {
    const { min, max } = this.bounds();
    if (!isWithin(date, min, max) || this.isOff()) {
      return;
    }
    const iso = toIsoDate(date);
    const changed = iso !== this.value.get();
    this.value.set(iso);
    this.focus();
    this.events.emit('pick', iso);
    if (changed) {
      this.events.emit('change', iso);
    }
  }

  /** A new value: its month shows, the focus moves to it, and the form gets it (or nothing, when unreadable). */
  private renderValue(): void {
    const date = parseIsoDate(this.value.get());
    if (date !== null) {
      this._state.view = date;
      this._state.focus = date;
    }
    this.internals.setFormValue(date === null ? '' : toIsoDate(date));
    this.renderValidity();
    this.renderPage();
  }

  /** The month shown, moved to the nearest one with days that can be chosen: today may be before `min`. */
  private viewWithin(min: CalendarDate | null, max: CalendarDate | null): CalendarDate {
    const view = this._state.view;
    return monthHasDaysWithin(view.year, view.month, min, max) ? view : clampDate(view, min, max);
  }

  /** The day the grid lets focus on: the remembered one when it is on the page, else the first day it can. */
  private rovingDate(min: CalendarDate | null, max: CalendarDate | null): CalendarDate {
    const view = this._state.view;
    const focus = this._state.focus ?? calendarDateOf(new Date());
    if (isSameMonth(focus, view) && isWithin(focus, min, max)) {
      return focus;
    }
    return clampDate({ ...view, day: 1 }, min, max);
  }

  private renderPage(): void {
    const { min, max } = this.bounds();
    this._state.view = this.viewWithin(min, max);
    const { year, month } = this._state.view;
    const locale = pageLocale(this.locale.get());
    const firstDay = this.firstDay.get();
    const context: PageContext = {
      focus: this.rovingDate(min, max),
      label: dateFormatter(locale, FULL_DATE),
      max,
      min,
      month,
      selected: parseIsoDate(this.value.get()),
      today: calendarDateOf(new Date()),
    };
    this._state.focus = context.focus;
    this.renderTitle(formatMonthTitle(year, month, locale));
    this.renderWeekdays(locale, firstDay);
    this._refs.days.replaceChildren(
      ...monthGrid(year, month, firstDay).map((week) => <tr>{week.map((date) => this.dayCell(date, context))}</tr>)
    );
    this.renderNavigation(min, max);
  }

  /** The title is a live region: written only when the month changes, so it is announced once. */
  private renderTitle(text: string): void {
    const title = this._refs.title;
    if (title.textContent !== text) {
      title.textContent = text;
    }
  }

  private renderWeekdays(locale: string | undefined, firstDay: Weekday): void {
    const short = weekdayNames(locale, firstDay, 'short');
    const long = weekdayNames(locale, firstDay, 'long');
    this._refs.weekdays.replaceChildren(
      ...short.map((name, index) => (
        <th scope="col" abbr={long[index] ?? name}>
          {name}
        </th>
      ))
    );
  }

  private dayCell(date: CalendarDate, context: PageContext): Node {
    const outside = date.month !== context.month;
    const enabled = isWithin(date, context.min, context.max);
    return (
      <td
        class={outside ? 'day outside' : 'day'}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the cells of the ARIA date grid
        role="gridcell"
        tabIndex={isSameDate(date, context.focus) && !this.isOff() ? 0 : -1}
        data-date={toIsoDate(date)}
        aria-label={context.label(date)}
        aria-selected={String(isSameDate(date, context.selected))}
        aria-disabled={enabled ? undefined : 'true'}
        aria-current={isSameDate(date, context.today) ? 'date' : undefined}>
        <span class="number">{String(date.day)}</span>
      </td>
    );
  }

  /** Only the remembered day is in the tab order: the arrows reach the others. */
  private renderFocus(): void {
    const focus = this._state.focus;
    const iso = focus === null ? '' : toIsoDate(focus);
    for (const cell of this._refs.days.querySelectorAll<HTMLElement>('[data-date]')) {
      cell.tabIndex = cell.dataset.date === iso && !this.isOff() ? 0 : -1;
    }
  }

  /** The arrows of the header stop where no day of the next month could be chosen. */
  private renderNavigation(min: CalendarDate | null, max: CalendarDate | null): void {
    const view = this._state.view;
    const previous = addMonths({ ...view, day: 1 }, -1);
    const next = addMonths({ ...view, day: 1 }, 1);
    const off = this.isOff();
    this._refs.previous.disabled = off || !monthHasDaysWithin(previous.year, previous.month, min, max);
    this._refs.next.disabled = off || !monthHasDaysWithin(next.year, next.month, min, max);
  }

  private renderValidity(): void {
    if (this.required.get() && parseIsoDate(this.value.get()) === null) {
      this.internals.setValidity({ valueMissing: true }, jlText('chooseDateMissing'));
      return;
    }
    this.internals.setValidity({});
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this._refs.grid.toggleAttribute('aria-disabled', this.isOff());
    this.renderPage();
  }
}

JlCalendar.register();
