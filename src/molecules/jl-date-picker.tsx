import { css } from '@jadis/core';
import { Calendar, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { clampedNumber, oneOf } from '../lib/attributes';
import {
  compareDates,
  dateOrder,
  datePattern,
  formatDate,
  isDateText,
  NUMERIC_DATE,
  parseIsoDate,
  parseTypedDate,
  toIsoDate,
} from '../lib/calendar';
import { setOrRemove, uniqueId } from '../lib/dom';
import { followAnchor } from '../lib/floating';
import { registerIcons } from '../lib/icons';
import { pageLocale } from '../lib/locale';
import { CONTROL_SIZES } from '../lib/options';
import { BASE_STYLES, CONTROL_STYLES, FLOATING_STYLES } from '../styles/shared';
import { JlCalendar } from './jl-calendar';
import styles from './jl-date-picker.css?raw';

import type { Weekday } from '../types/calendar.types';
import type { Placement } from '../types/floating.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ calendar: Calendar, x: X });

const ICON_SIZE = 16;
const ACTION_ICON_SIZE = 14;
const PLACEMENT: Placement = 'bottom-start';
const MONDAY: Weekday = 1;
const SUNDAY: Weekday = 0;
const SATURDAY: Weekday = 6;
const VALUE_MISSING = 'Choose a date.';
const DIALOG_LABEL = 'Choose a date';

const parseWeekday = (value: string | null): Weekday =>
  Math.round(clampedNumber(MONDAY, SUNDAY, SATURDAY)(value)) as Weekday;

/**
 * A field for a date: it shows the date in digits, in the `locale`'s order (`25.10.2026`, `10/25/2026`), and opens a
 * calendar from its button, Alt + Down or Down. People may also type the date: as it shows, with any separators or
 * none (`25102026`), or year first. Phones show their number keys; letters are refused. `value` and the form hold
 * the ISO date.
 */
export class JlDatePicker extends JlFormControl {
  static readonly selector = 'jl-date-picker';

  readonly events = this.useEvents<{ change: string }>();

  /** The date, as ISO (`2026-10-25`); empty for none. */
  readonly value = this.useChange('', () => this.renderValue(), { attribute: 'value' });
  /** Without one, the field shows how a date is typed in its locale: `dd.mm.yyyy`. */
  readonly placeholder = this.useChange('', () => this.renderPlaceholder(), { attribute: 'placeholder' });
  /** The field's name for screen readers, when no visible label names it. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.native, 'aria-label', value), {
    attribute: 'label',
  });
  /** The first day that can be chosen, as ISO. */
  readonly min = this.useChange('', (value) => this.renderBound('min', value), { attribute: 'min' });
  /** The last day that can be chosen, as ISO. */
  readonly max = this.useChange('', (value) => this.renderBound('max', value), { attribute: 'max' });
  /** The language the date and the calendar are written in: `fr-CH`. The page's by default. */
  readonly locale = this.useChange(
    '',
    (value) => {
      this._refs.calendar.locale.set(value);
      this.renderPlaceholder();
      this.renderValue();
    },
    { attribute: 'locale' }
  );
  /** The day the calendar's weeks start on: 0 for Sunday, 1 for Monday. */
  readonly firstDay = this.useChange<Weekday>(MONDAY, (value) => this._refs.calendar.firstDay.set(value), {
    attribute: 'first-day',
    parse: parseWeekday,
  });
  /** Shows a button that empties the field while it holds a date. */
  readonly clearable = this.useChange(false, () => this.renderClear(), { attribute: 'clearable' });
  readonly required = this.useChange(
    false,
    (value) => {
      this._refs.native.toggleAttribute('aria-required', value);
      this.reflect('required', value);
      this.renderValidity();
    },
    { attribute: 'required' }
  );
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** Draws the field in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(
    false,
    (value) => {
      this.reflect('invalid', value);
      this._refs.native.toggleAttribute('aria-invalid', value);
    },
    { attribute: 'invalid' }
  );
  readonly size = this.useChange<ControlSize>('md', (value) => this.reflect('size', value), {
    attribute: 'size',
    parse: oneOf(CONTROL_SIZES, 'md'),
  });

  private readonly _popupId = uniqueId('jl-date-picker-popup');

  private readonly _state = {
    opening: new AbortController(),
    /** Whether a press on the button should open: read before the press closes the calendar by light dismiss. */
    openOnPress: null as boolean | null,
  };

  private readonly _refs = this.useRefs((ref) => ({
    calendar: ref<JlCalendar>('jl-calendar'),
    clear: ref<HTMLButtonElement>('.clear'),
    control: ref('.control'),
    native: ref<HTMLInputElement>('input'),
    open: ref<HTMLButtonElement>('.open'),
    popup: ref('.popup'),
  }));

  override focus(options?: FocusOptions): void {
    this._refs.native.focus(options);
  }

  /** Opens the calendar, with the focus on its day. */
  show(): void {
    this.whenRendered(() => this.openPopup());
  }

  /** Closes the calendar. */
  hide(): void {
    this.whenRendered(() => this.closePopup());
  }

  templateHtml(): Node {
    return (
      <>
        <div class="control" attrs={{ part: 'base' }}>
          <input
            class="native"
            role="combobox"
            autocomplete="off"
            spellcheck={false}
            inputMode="decimal"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls={this._popupId}
          />
          <button class="action clear" type="button" aria-label="Clear" tabIndex={-1} hidden>
            <JlIcon name="x" size={ACTION_ICON_SIZE} />
          </button>
          <button
            class="action open"
            type="button"
            aria-label={DIALOG_LABEL}
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls={this._popupId}>
            <JlIcon name="calendar" size={ICON_SIZE} />
          </button>
        </div>
        <div
          class="floating panel popup"
          id={this._popupId}
          popover="auto"
          role="dialog"
          aria-label={DIALOG_LABEL}
          attrs={{ part: 'popup' }}>
          <JlCalendar class="calendar" />
        </div>
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${CONTROL_STYLES}${FLOATING_STYLES}${styles}`;
  }

  onConnect(): void {
    const native = this._refs.native;
    const open = this._refs.open;
    // The native event crosses the shadow root: our change carries the date.
    this.on(native, 'input', (event) => {
      event.stopPropagation();
      this.renderClear();
    });
    // Digits and separators only: letters never reach the field (and phones show their number keys).
    this.on(native, 'beforeinput', (event) => {
      if (event.data !== null && !isDateText(event.data)) {
        event.preventDefault();
      }
    });
    this.on(native, 'change', () => this.commitText());
    this.on(native, 'keydown', (event) => this.onKey(event));
    this.on(open, 'pointerdown', () => {
      this._state.openOnPress = !this.isOpen();
    });
    this.on(open, 'click', () => this.onOpenPress());
    this.on(this._refs.clear, 'mousedown', (event) => event.preventDefault());
    this.on(this._refs.clear, 'click', () => this.clearValue());
    this.on(this._refs.popup, 'toggle', (event) => this.onToggle(event as ToggleEvent));
    this.on(this._refs.popup, 'keydown', (event) => this.onPopupKey(event));
    this._refs.calendar.events.register('pick', (iso) => this.onPick(iso));
  }

  onDisconnect(): void {
    this._state.opening.abort();
  }

  protected resetValue(): void {
    this.value.set(this.getAttribute('value') ?? '');
  }

  protected setDisabledByForm(disabled: boolean): void {
    const off = disabled || this.disabled.get();
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => {
      this._refs.native.disabled = off;
      this._refs.open.disabled = off;
    });
  }

  private isOpen(): boolean {
    return this._refs.popup.matches(':popover-open');
  }

  /** Down (with or without Alt) opens the calendar. */
  private onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.openPopup();
    }
  }

  private onOpenPress(): void {
    const shouldOpen = this._state.openOnPress ?? !this.isOpen();
    this._state.openOnPress = null;
    if (shouldOpen) {
      this.openPopup();
      return;
    }
    this.closePopup();
  }

  private onToggle(event: ToggleEvent): void {
    const open = event.newState === 'open';
    this._refs.native.setAttribute('aria-expanded', String(open));
    this._refs.open.setAttribute('aria-expanded', String(open));
    this.reflect('open', open);
    if (!open) {
      this._state.opening.abort();
    }
  }

  /** Escape closes the calendar and brings the focus back to the field, where it came from. */
  private onPopupKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    this.closePopup();
    this.focus();
  }

  private onPick(iso: string): void {
    this.closePopup();
    this.commit(iso);
    this.focus();
  }

  private openPopup(): void {
    if (this.isOpen() || this.disabled.get() || this._refs.native.disabled) {
      return;
    }
    this.commitText();
    const calendar = this._refs.calendar;
    calendar.value.set(this.validIso());
    const popup = this._refs.popup;
    popup.showPopover();
    this._state.opening.abort();
    this._state.opening = new AbortController();
    followAnchor(this._refs.control, popup, PLACEMENT, this._state.opening.signal);
    calendar.focus();
  }

  private closePopup(): void {
    if (this.isOpen()) {
      this._refs.popup.hidePopover();
    }
  }

  /**
   * The typed text: a date in the locale's order (any separators, or none) or year first sets the value, an empty
   * field clears it, anything else goes back to the date there was.
   */
  private commitText(): void {
    const native = this._refs.native;
    const text = native.value.trim();
    if (text === this.display(this.value.get())) {
      return;
    }
    if (text === '') {
      this.commit('');
      return;
    }
    const date = parseTypedDate(text, dateOrder(pageLocale(this.locale.get())));
    if (date === null) {
      this.renderValue();
      return;
    }
    this.commit(toIsoDate(date));
  }

  /** Sets the value as people chose it, and says so when it changed. */
  private commit(iso: string): void {
    const changed = iso !== this.value.get();
    this.value.set(iso);
    if (changed) {
      this.events.emit('change', iso);
    }
  }

  private clearValue(): void {
    this.commit('');
    this.focus();
  }

  /** The value when it is a real ISO date, otherwise nothing. */
  private validIso(): string {
    const date = parseIsoDate(this.value.get());
    return date === null ? '' : toIsoDate(date);
  }

  private display(value: string): string {
    const date = parseIsoDate(value);
    return date === null ? '' : formatDate(date, pageLocale(this.locale.get()), NUMERIC_DATE);
  }

  private renderPlaceholder(): void {
    this._refs.native.placeholder = this.placeholder.get() || datePattern(pageLocale(this.locale.get()));
  }

  private renderValue(): void {
    const value = this.validIso();
    this._refs.native.value = this.display(value);
    this._refs.calendar.value.set(value);
    this.internals.setFormValue(value);
    this.renderValidity();
    this.renderClear();
  }

  private renderBound(bound: 'min' | 'max', value: string): void {
    this._refs.calendar[bound].set(value);
    this.renderValidity();
  }

  /** Required, and within min and max, as a native date field checks it. */
  private renderValidity(): void {
    const date = parseIsoDate(this.value.get());
    const anchor = this._refs.native;
    if (date === null) {
      this.renderMissing(anchor);
      return;
    }
    const min = parseIsoDate(this.min.get());
    const max = parseIsoDate(this.max.get());
    const locale = pageLocale(this.locale.get());
    if (min !== null && compareDates(date, min) < 0) {
      this.internals.setValidity({ rangeUnderflow: true }, `Choose ${formatDate(min, locale)} or later.`, anchor);
      return;
    }
    if (max !== null && compareDates(date, max) > 0) {
      this.internals.setValidity({ rangeOverflow: true }, `Choose ${formatDate(max, locale)} or earlier.`, anchor);
      return;
    }
    this.internals.setValidity({});
  }

  private renderMissing(anchor: HTMLElement): void {
    if (this.required.get()) {
      this.internals.setValidity({ valueMissing: true }, VALUE_MISSING, anchor);
      return;
    }
    this.internals.setValidity({});
  }

  private renderClear(): void {
    const editable = !this.disabled.get();
    this._refs.clear.hidden = !(this.clearable.get() && editable && this._refs.native.value !== '');
  }

  private renderDisabled(disabled: boolean): void {
    this._refs.native.disabled = disabled;
    this._refs.open.disabled = disabled;
    this.reflect('disabled', disabled);
    this.closePopup();
    this.renderClear();
  }
}

JlDatePicker.register();
