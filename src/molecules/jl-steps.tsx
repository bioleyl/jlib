import { css } from '@jadis/core';
import { Check, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { clampedNumber, jsonOf, oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-steps.css?inline';

import type { StepItem, StepStatus, StepsOrientation } from '../types/jl-steps.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check, x: X });

export const STEPS_ORIENTATIONS: readonly StepsOrientation[] = ['horizontal', 'vertical'];

const CHECK_SIZE = 14;
const MAX_STEPS = 100;

// What a screen reader hears after a step's name, by its status: nothing for one still to come.
const STATUS_TEXTS: Record<StepStatus, 'stepCurrent' | 'stepDone' | null> = {
  current: 'stepCurrent',
  done: 'stepDone',
  upcoming: null,
};

const statusText = (status: StepStatus): string => {
  const key = STATUS_TEXTS[status];
  return key === null ? '' : jlText(key);
};

/** The icon a step's marker shows: none for its number. */
const markerIcon = (item: StepItem, status: StepStatus): string => {
  if (item.failed) {
    return 'x';
  }
  return status === 'done' ? 'check' : '';
};

const statusOf = (index: number, current: number): StepStatus => {
  if (index < current) {
    return 'done';
  }
  return index === current ? 'current' : 'upcoming';
};

/**
 * The steps of a process and where people are in it: done steps show a check, the current one is in the accent
 * colour. With `clickable`, people can go back to a done step; `change` fires with its index.
 */
export class JlSteps extends JlElement {
  static readonly selector = 'jl-steps';

  readonly events = this.useEvents<{ change: number }>();

  readonly items = this.useChange<StepItem[]>([], (value) => this.renderItems(value), {
    attribute: 'items',
    parse: jsonOf([]),
  });
  /** The index of the current step, from 0; the number of steps when all are done. */
  readonly current = this.useChange(0, () => this.renderStatuses(), {
    attribute: 'current',
    parse: clampedNumber(0, 0, MAX_STEPS),
  });
  readonly orientation = this.useChange<StepsOrientation>(
    'horizontal',
    (value) => this.reflect('orientation', value),
    { attribute: 'orientation', parse: oneOf(STEPS_ORIENTATIONS, 'horizontal') }
  );
  /** Done steps become buttons that go back to them. */
  readonly clickable = this.useChange(false, () => this.renderStatuses(), { attribute: 'clickable' });
  /** The list's name for screen readers. */
  readonly label = this.useChange('', () => this.renderLabel(), { attribute: 'label' });

  // The items the steps show: the same list again (an attribute's second call at connection) makes none.
  private readonly _drawn: { items?: StepItem[] } = {};

  private readonly _refs = this.useRefs((ref) => ({ list: ref('ol') }));

  templateHtml(): Node {
    return <ol attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.list, 'click', (event) => {
      const step = (event.target as Element).closest('button.head')?.parentElement;
      if (step instanceof HTMLElement) {
        this.goBackTo([...this._refs.list.children].indexOf(step));
      }
    });
  }

  protected drawTexts(): void {
    this.renderLabel();
    this.renderStatuses();
  }

  private renderLabel(): void {
    this._refs.list.setAttribute('aria-label', this.label.get() || jlText('progress'));
  }

  /** Makes a step for each item; where people are in them is drawn on them after. */
  private renderItems(items: StepItem[]): void {
    if (items === this._drawn.items) {
      return;
    }
    this._drawn.items = items;
    this._refs.list.replaceChildren(...items.map((item) => this.step(item)));
    this.renderStatuses();
  }

  private step(item: StepItem): Node {
    return (
      <li class="step" data-failed={item.failed ? '' : undefined}>
        <div class="head">
          <span class="marker" aria-hidden="true" />
          <span class="text">
            <span class="label">
              {item.label}
              <span class="status sr-only" />
            </span>
            {item.description === undefined ? '' : <span class="description">{item.description}</span>}
          </span>
        </div>
        <span class="line" aria-hidden="true" />
      </li>
    );
  }

  /** Where each step stands against the current one, drawn on the steps there are. */
  private renderStatuses(): void {
    const current = this.current.get();
    const items = this.items.get();
    this._refs.list.querySelectorAll<HTMLElement>('.step').forEach((step, index) => {
      const item = items[index];
      if (item !== undefined) {
        this.renderStatus(step, item, index, statusOf(index, current));
      }
    });
  }

  private renderStatus(step: HTMLElement, item: StepItem, index: number, status: StepStatus): void {
    step.dataset.status = status;
    setOrRemove(step, 'aria-current', status === 'current' ? 'step' : '');
    const head = this.renderHead(step, status === 'done' && this.clickable.get());
    // The current step's head takes the focus from the button people went back to it with.
    setOrRemove(head, 'tabindex', status === 'current' ? '-1' : '');
    this.renderMarker(head.querySelector('.marker') as HTMLElement, item, index, status);
    const said = head.querySelector('.status') as HTMLElement;
    said.textContent = item.failed ? jlText('failedStep') : statusText(status);
  }

  /** A done step that people can go back to is a button; any other step a plain block, its content moved over. */
  private renderHead(step: HTMLElement, canGoBack: boolean): HTMLElement {
    const head = step.querySelector('.head') as HTMLElement;
    const tag = canGoBack ? 'button' : 'div';
    if (head.localName === tag) {
      return head;
    }
    const swapped = canGoBack ? <button type="button" class="head" /> : <div class="head" />;
    swapped.append(...head.childNodes);
    head.replaceWith(swapped);
    return swapped as HTMLElement;
  }

  /** A failed step's ×, a done one's check, or the step's number: an icon is made only for the steps that show one. */
  private renderMarker(marker: HTMLElement, item: StepItem, index: number, status: StepStatus): void {
    const name = markerIcon(item, status);
    if (name === '') {
      marker.textContent = String(index + 1);
      return;
    }
    const icon = marker.querySelector<JlIcon>(JlIcon.selector);
    if (icon !== null) {
      icon.name.set(name);
      return;
    }
    marker.replaceChildren(<JlIcon name={name} size={CHECK_SIZE} />);
  }

  /** Goes back to a done step people picked, and says so. */
  private goBackTo(index: number): void {
    if (index >= this.current.get()) {
      return;
    }
    this.current.set(index);
    this.events.emit('change', index);
    this._refs.list.querySelector<HTMLElement>('[aria-current] .head')?.focus();
  }
}

JlSteps.register();
