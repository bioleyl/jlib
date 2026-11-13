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
  WEEKS_PER_GRID,
  weekdayNames,
} from '../lib/calendar';
import { setAriaFlag, setOrRemove, uniqueId } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { pageLocale } from '../lib/locale';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-calendar.css?inline';

import type { CalendarDate, Weekday } from '../types/calendar.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight });

const NAV_ICON_SIZE = 16;
const MONDAY: Weekday = 1;
const SUNDAY: Weekday = 0;
const SATURDAY: Weekday = 6;
const DAYS_PER_WEEK = 7;
const SELECT_KEYS = ['Enter', ' '];
// The day that holds the Tab stop: the only one of the grid in the Tab order.
const TAB_STOP = '[tabindex="0"]';
const FULL_DATE: Intl.DateTimeFormatOptions = { dateStyle: 'full' };

/** The first day of the week from its attribute: 0 (Sunday) to 6 (Saturday), Monday when absent. */
const parseWeekday = (value: string | null): Weekday =>
  Math.round(clampedNumber(MONDAY, SUNDAY, SATURDAY)(value)) as Weekday;

/** What the cells of a page need to show their dates. */
type PageContext = {
  label: (date: CalendarDate) => string;
  month: number;
  today: CalendarDate;
};

/** Writes an attribute only when it changes: the same value written again is still a change, styles checked again. */
function setAttributeIfChanged(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) {
    return;
  }
  value === null ? element.removeAttribute(name) : element.setAttribute(name, value);
}

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

  /**
   * The month shown, the day the arrows move from (the one focusable cell of the grid), and the dates the cells show.
   * `drawn` holds what the cells and the weekdays were written for: every input calls back as the calendar connects,
   * and choosing a day changes only two cells.
   */
  private readonly _state = {
    drawn: { days: '', weekdays: '' },
    focus: null as CalendarDate | null,
    formDisabled: false,
    page: [] as CalendarDate[],
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
    this.tabStop()?.focus(options);
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
            <tr>
              {Array.from({ length: DAYS_PER_WEEK }, () => (
                <th scope="col" />
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: WEEKS_PER_GRID }, () => (
              <tr>{Array.from({ length: DAYS_PER_WEEK }, () => this.dayCell())}</tr>
            ))}
          </tbody>
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
    this.whenRendered(() => this.drawDisabled());
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
    this._state.focus = date;
    this._state.view = date;
    this.renderPage();
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
    this._state.focus = this.rovingDate(min, max);
    const locale = pageLocale(this.locale.get());
    this.renderWeekdays(locale, this.firstDay.get());
    this.renderDays(locale);
    this.renderStates(min, max);
    this.renderNavigation(min, max);
    // The day that holds the Tab stop is where a missing date is said.
    this.renderValidity();
  }

  /** The day the Tab key reaches: the one the arrows move from. */
  private tabStop(): HTMLElement | null {
    return this._refs.days.querySelector<HTMLElement>(TAB_STOP);
  }

  /** The title is a live region: written only when the month changes, so it is announced once. */
  private renderTitle(text: string): void {
    const title = this._refs.title;
    if (title.textContent !== text) {
      title.textContent = text;
    }
  }

  private renderWeekdays(locale: string | undefined, firstDay: Weekday): void {
    const drawn = `${locale}|${firstDay}`;
    if (drawn === this._state.drawn.weekdays) {
      return;
    }
    this._state.drawn.weekdays = drawn;
    const long = weekdayNames(locale, firstDay, 'long');
    const headers = this._refs.weekdays.querySelectorAll('th');
    weekdayNames(locale, firstDay, 'short').forEach((name, index) => {
      const header = headers.item(index);
      header.textContent = name;
      header.abbr = long[index] ?? name;
    });
  }

  /** Writes the page's dates in the cells: only for another month, language, first day, or today. */
  private renderDays(locale: string | undefined): void {
    const { year, month } = this._state.view;
    const firstDay = this.firstDay.get();
    const today = calendarDateOf(new Date());
    const drawn = `${locale}|${firstDay}|${year}-${month}|${toIsoDate(today)}`;
    if (drawn === this._state.drawn.days) {
      return;
    }
    this._state.drawn.days = drawn;
    this._state.page = monthGrid(year, month, firstDay).flat();
    this.renderTitle(formatMonthTitle(year, month, locale));
    const context: PageContext = { label: dateFormatter(locale, FULL_DATE), month, today };
    this.forEachDay((cell, date) => this.writeDay(cell, date, context));
  }

  private writeDay(cell: HTMLTableCellElement, date: CalendarDate, context: PageContext): void {
    cell.dataset.date = toIsoDate(date);
    cell.setAttribute('aria-label', context.label(date));
    cell.classList.toggle('outside', date.month !== context.month);
    setAttributeIfChanged(cell, 'aria-current', isSameDate(date, context.today) ? 'date' : null);
    const number = cell.firstElementChild;
    if (number !== null) {
      number.textContent = String(date.day);
    }
  }

  /** The chosen day, the days out of bounds, and the one in the tab order (the arrows reach the others). */
  private renderStates(min: CalendarDate | null, max: CalendarDate | null): void {
    const selected = parseIsoDate(this.value.get());
    const focus = this.isOff() ? null : this._state.focus;
    this.forEachDay((cell, date) => {
      setAttributeIfChanged(cell, 'aria-selected', String(isSameDate(date, selected)));
      setAttributeIfChanged(cell, 'aria-disabled', isWithin(date, min, max) ? null : 'true');
      setAttributeIfChanged(cell, 'tabindex', isSameDate(date, focus) ? '0' : '-1');
    });
  }

  private forEachDay(write: (cell: HTMLTableCellElement, date: CalendarDate) => void): void {
    const cells = this._refs.days.querySelectorAll('td');
    this._state.page.forEach((date, index) => {
      write(cells.item(index), date);
    });
  }

  /** A day of the grid, made once: the page's dates are written in it. */
  private dayCell(): Node {
    return (
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the cells of the ARIA date grid
      <td class="day" role="gridcell" tabIndex={-1} aria-selected="false">
        <span class="number" />
      </td>
    );
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
      // Anchored on a day: the browser focuses it and shows the message there. With nowhere to, it refuses to submit
      // the form without a word.
      this.internals.setValidity({ valueMissing: true }, jlText('chooseDateMissing'), this.tabStop() ?? undefined);
      return;
    }
    this.internals.setValidity({});
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this.drawDisabled();
  }

  /** Without the attribute: the form says its state before the `disabled` input has taken the attribute's change. */
  private drawDisabled(): void {
    // On the group too: its title and arrows are part of what is off.
    setAriaFlag(this._refs.base, 'aria-disabled', this.isOff());
    setAriaFlag(this._refs.grid, 'aria-disabled', this.isOff());
    this.renderPage();
  }
}

JlCalendar.register();
