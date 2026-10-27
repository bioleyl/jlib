import { css } from '@jadis/core';
import { CircleCheck, CircleX, Info, Sparkles, TriangleAlert, X } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { JlIcon } from '../atoms/jl-icon';
import { JlProgress } from '../atoms/jl-progress';
import { JlElement } from '../base/jl-element';
import { oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { TONE_ICON_FILLED, TONE_ICONS } from '../lib/options';
import { optionalNumber } from '../lib/progress';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-toast.css?raw';

import type { ToastTone } from '../types/jl-toast.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  info: Info,
  sparkles: Sparkles,
  'triangle-alert': TriangleAlert,
  x: X,
});

export const TOAST_TONES: readonly ToastTone[] = ['neutral', 'ok', 'warn', 'danger', 'info'];

const ICON_SIZE = 18;
const ENTER_MS = 240;
const LEAVE_MS = 180;
// The enter offset; a toaster at the top of the window turns it upside down through this property.
const ENTER_OFFSET = '--jl-toast-enter';
const DEFAULT_OFFSET = '8px';
const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const TOASTER = 'jl-toaster';

/** Alone on a page, a toast announces itself: danger interrupts, the others wait their turn. */
const STANDALONE_ROLES: Record<ToastTone, 'status' | 'alert'> = {
  danger: 'alert',
  info: 'status',
  neutral: 'status',
  ok: 'status',
  warn: 'status',
};

const prefersReducedMotion = (): boolean => window.matchMedia(REDUCED_MOTION).matches;

/**
 * One notification: a heading, a line of text, an icon in its tone's colour, and maybe an action such as "Undo".
 * With a `duration` it closes by itself, a thin line showing the time left; hovering or focusing it pauses the
 * line. While `working`, it shows the progress of the work it tells about (a download): `progress` percent, or a
 * bar running back and forth without it. It emits `dismiss` once it has closed. Most pages call `toast()` rather
 * than writing it.
 */
export class JlToast extends JlElement {
  static readonly selector = 'jl-toast';

  readonly events = this.useEvents<{ action: undefined; dismiss: undefined }>();

  readonly tone = this.useChange<ToastTone>(
    'neutral',
    (value) => {
      this.reflect('tone', value);
      this.renderIcon();
      this.renderRole();
    },
    { attribute: 'tone', parse: oneOf(TOAST_TONES, 'neutral') }
  );
  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
      this._refs.heading.hidden = value === '';
    },
    { attribute: 'heading' }
  );
  readonly text = this.useChange(
    '',
    (value) => {
      this._refs.text.textContent = value;
      this._refs.text.hidden = value === '';
    },
    { attribute: 'text' }
  );
  /** An icon name; the tone's icon when empty. */
  readonly icon = this.useChange('', () => this.renderIcon(), { attribute: 'icon' });
  /** Shows a close button. */
  readonly closable = this.useChange(
    false,
    (value) => {
      this._refs.close.hidden = !value;
    },
    { attribute: 'closable' }
  );
  /** The text of a quiet button that emits `action`, then closes the toast. */
  readonly actionLabel = this.useChange(
    '',
    (value) => {
      this._refs.action.label.set(value);
      this._refs.action.hidden = value === '';
    },
    { attribute: 'action-label' }
  );
  /** How long it stays, in milliseconds; 0 keeps it until it is closed. */
  readonly duration = this.useChange(0, () => this.startTimer(), { attribute: 'duration' });
  /** Shows a progress bar under the text, while the work it tells about runs. */
  readonly working = this.useChange(
    false,
    (value) => {
      this._refs.work.hidden = !value;
    },
    { attribute: 'working' }
  );
  /** How far the work is, in percent; `null` (no attribute) for work of unknown length. */
  readonly progress = this.useChange<number | null>(null, (value) => this._refs.work.value.set(value), {
    attribute: 'progress',
    parse: optionalNumber,
  });

  private readonly _timer = { animation: null as Animation | null, entered: false };
  private readonly _hold = { focus: false, pointer: false };

  private readonly _refs = this.useRefs((ref) => ({
    action: ref<JlButton>('.action'),
    bar: ref('.bar'),
    close: ref<JlButton>('.close'),
    heading: ref('.heading'),
    icon: ref<JlIcon>('.icon'),
    progress: ref('.progress'),
    text: ref('.text'),
    toast: ref('.toast'),
    work: ref(JlProgress),
  }));

  /** Closes the toast: it leaves, hides, then emits `dismiss`. */
  dismiss(): void {
    if (this.hidden || this.hasAttribute('leaving')) {
      return;
    }
    this.stopTimer();
    this.reflect('leaving', true);
    const done = (): void => this.finishLeaving();
    if (!this.isConnected || prefersReducedMotion()) {
      done();
      return;
    }
    const offset = this.enterOffset();
    this._refs.toast
      .animate([{ opacity: 1 }, { opacity: 0, transform: `translateY(${offset}) scale(0.97)` }], {
        duration: LEAVE_MS,
        easing: EASE,
        fill: 'forwards',
      })
      .finished.then(done, done);
  }

  /** Shows a dismissed toast again, with its time from the start. */
  show(): void {
    this.hidden = false;
    this._timer.entered = false;
    this.whenRendered(() => {
      this.enter();
      this.startTimer();
    });
  }

  templateHtml(): Node {
    return (
      <div class="toast" attrs={{ part: 'base' }}>
        <JlIcon class="icon" size={ICON_SIZE} />
        <div class="content">
          <p class="heading" hidden />
          <p class="text" hidden />
          <JlProgress class="work" size="sm" hidden />
          <slot />
        </div>
        <div class="buttons">
          <JlButton class="action" variant="ghost" size="sm" hidden />
          <JlButton class="close" variant="ghost" size="sm" icon="x" hint={jlText('close')} hidden />
        </div>
        <div class="progress" aria-hidden="true" hidden>
          <div class="bar" />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.close.events.register('press', () => this.dismiss());
    this._refs.action.events.register('press', () => {
      this.events.emit('action');
      this.dismiss();
    });
    this.on(this, 'pointerenter', () => this.hold('pointer', true));
    this.on(this, 'pointerleave', () => this.hold('pointer', false));
    this.on(this, 'focusin', () => this.hold('focus', true));
    this.on(this, 'focusout', (event) => this.hold('focus', this.holdsFocus(event.relatedTarget)));
    this.renderRole();
    this.enter();
    this.resumeTimer();
  }

  onDisconnect(): void {
    this._timer.animation?.pause();
  }

  /** The way in, once per showing; WAAPI so that the toaster moving in the top layer does not replay it. */
  private enter(): void {
    if (this._timer.entered || this.hidden) {
      return;
    }
    this._timer.entered = true;
    if (prefersReducedMotion()) {
      return;
    }
    const offset = this.enterOffset();
    this._refs.toast.animate([{ opacity: 0, transform: `translateY(${offset}) scale(0.98)` }, { opacity: 1 }], {
      duration: ENTER_MS,
      easing: EASE,
    });
  }

  private enterOffset(): string {
    return getComputedStyle(this).getPropertyValue(ENTER_OFFSET).trim() || DEFAULT_OFFSET;
  }

  private finishLeaving(): void {
    this.reflect('leaving', false);
    this.hidden = true;
    this.events.emit('dismiss');
  }

  /**
   * The time left is the progress line's own animation: pausing it pauses the countdown, and it is not cut short by
   * reduced motion the way CSS animations are.
   */
  private startTimer(): void {
    this.stopTimer();
    const duration = this.duration.get();
    this._refs.progress.hidden = duration <= 0;
    if (duration <= 0 || !this.isConnected || this.hidden) {
      return;
    }
    const animation = this._refs.bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], {
      duration,
      easing: 'linear',
      fill: 'forwards',
    });
    animation.finished.then(
      () => this.dismiss(),
      () => undefined
    );
    this._timer.animation = animation;
    this.resumeTimer();
  }

  private stopTimer(): void {
    this._timer.animation?.cancel();
    this._timer.animation = null;
  }

  private resumeTimer(): void {
    const animation = this._timer.animation;
    if (animation === null) {
      return;
    }
    const held = this._hold.pointer || this._hold.focus;
    this.reflect('paused', held);
    if (held) {
      animation.pause();
      return;
    }
    animation.play();
  }

  private hold(reason: 'pointer' | 'focus', on: boolean): void {
    this._hold[reason] = on;
    this.resumeTimer();
  }

  /** Whether the focus, moving to `next`, stays in the toast (its buttons, or what the page slotted in it). */
  private holdsFocus(next: EventTarget | null): boolean {
    return next instanceof Node && (next === this || this.contains(next) || this._refs.toast.contains(next));
  }

  /** The tone's own icon is filled, so its colour shows at a glance; an icon of the page's stays as it is drawn. */
  private renderIcon(): void {
    const icon = this.icon.get();
    this._refs.icon.name.set(icon === '' ? TONE_ICONS[this.tone.get()] : icon);
    this._refs.icon.filled.set(icon === '' && TONE_ICON_FILLED[this.tone.get()]);
  }

  /** Inside a toaster, its live region announces the toast; alone, the toast is its own. */
  private renderRole(): void {
    if (this.closest(TOASTER) !== null) {
      this._refs.toast.removeAttribute('role');
      return;
    }
    this._refs.toast.setAttribute('role', STANDALONE_ROLES[this.tone.get()]);
  }
}

JlToast.register();
