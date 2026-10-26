import { css } from '@jadis/core';
import { Check } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { clampedNumber, jsonOf, oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-steps.css?raw';

import type { StepItem, StepStatus, StepsOrientation } from '../types/jl-steps.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ check: Check });

export const STEPS_ORIENTATIONS: readonly StepsOrientation[] = ['horizontal', 'vertical'];

const CHECK_SIZE = 14;
const MAX_STEPS = 100;
const DEFAULT_LABEL = 'Progress';

// What screen readers hear after a step's label.
const STATUS_TEXT: Record<StepStatus, string> = {
  current: ', current step',
  done: ', completed',
  upcoming: '',
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

  readonly items = this.useChange<StepItem[]>([], () => this.render(), {
    attribute: 'items',
    parse: jsonOf([]),
  });
  /** The index of the current step, from 0; the number of steps when all are done. */
  readonly current = this.useChange(0, () => this.render(), {
    attribute: 'current',
    parse: clampedNumber(0, 0, MAX_STEPS),
  });
  readonly orientation = this.useChange<StepsOrientation>(
    'horizontal',
    (value) => this.reflect('orientation', value),
    { attribute: 'orientation', parse: oneOf(STEPS_ORIENTATIONS, 'horizontal') }
  );
  /** Done steps become buttons that go back to them. */
  readonly clickable = this.useChange(false, () => this.render(), { attribute: 'clickable' });
  /** The list's name for screen readers. */
  readonly label = this.useChange(
    DEFAULT_LABEL,
    (value) => {
      this._refs.list.setAttribute('aria-label', value || DEFAULT_LABEL);
    },
    { attribute: 'label' }
  );

  private readonly _refs = this.useRefs((ref) => ({ list: ref('ol') }));

  templateHtml(): Node {
    return <ol attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.list, 'click', (event) => {
      const target = (event.target as Element).closest<HTMLElement>('button[data-index]');
      if (target !== null) {
        this.goBackTo(Number(target.dataset.index));
      }
    });
  }

  private render(): void {
    const current = this.current.get();
    this._refs.list.replaceChildren(
      ...this.items.get().map((item, index) => this.step(item, index, statusOf(index, current)))
    );
  }

  private step(item: StepItem, index: number, status: StepStatus): Node {
    const content = [
      <span class="marker" aria-hidden="true">
        {status === 'done' ? <JlIcon name="check" size={CHECK_SIZE} /> : String(index + 1)}
      </span>,
      <span class="text">
        <span class="label">
          {item.label}
          <span class="sr-only">{STATUS_TEXT[status]}</span>
        </span>
        {item.description === undefined ? '' : <span class="description">{item.description}</span>}
      </span>,
    ];
    const canGoBack = status === 'done' && this.clickable.get();
    return (
      <li class="step" data-status={status} aria-current={status === 'current' ? 'step' : undefined}>
        {canGoBack ? (
          <button type="button" class="head" data-index={index}>
            {content}
          </button>
        ) : (
          <div class="head" tabIndex={status === 'current' ? -1 : undefined}>
            {content}
          </div>
        )}
        <span class="line" aria-hidden="true" />
      </li>
    );
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
