import type { ControlSize, Tone } from '../types/options.types';

export const TONES: readonly Tone[] = ['neutral', 'accent', 'ok', 'warn', 'danger', 'info'];

export const CONTROL_SIZES: readonly ControlSize[] = ['md', 'sm', 'lg'];

/** The icon that says each tone at a glance: alerts, toasts and callouts use it. */
export const TONE_ICONS: Record<Tone, string> = {
  accent: 'sparkles',
  danger: 'circle-x',
  info: 'info',
  neutral: 'info',
  ok: 'circle-check',
  warn: 'triangle-alert',
};
