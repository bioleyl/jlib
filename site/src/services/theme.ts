import { Bus } from '@jadis/core';

import type { ThemeMode } from '../types/site.types';

const STORAGE_KEY = 'jlib-theme';
const MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

export const themeBus = new Bus<{ changed: ThemeMode }>();

const isMode = (value: string | null): value is ThemeMode => MODES.some((mode) => mode === value);

/** The mode chosen last time; storage may be blocked (private windows), then the system decides. */
export function storedTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isMode(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

function store(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Not kept for next time: the page still switches.
  }
}

/** Light or dark on the whole page, or the system's choice. */
export function applyTheme(mode: ThemeMode = storedTheme()): void {
  const root = document.documentElement;
  if (mode === 'system') {
    delete root.dataset.theme;
    return;
  }
  root.dataset.theme = mode;
}

export function setTheme(mode: ThemeMode): void {
  applyTheme(mode);
  store(mode);
  themeBus.emit('changed', mode);
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Whether the page shows dark now: chosen in the switch, or by the system when the switch says so. */
export function isDarkNow(): boolean {
  const chosen = document.documentElement.dataset.theme;
  if (chosen !== undefined) {
    return chosen === 'dark';
  }
  return window.matchMedia(DARK_QUERY).matches;
}

/** Calls back whenever the page may have turned light or dark, until the signal aborts. */
export function onDarkChange(callback: () => void, signal: AbortSignal): void {
  themeBus.register('changed', callback, signal);
  window.matchMedia(DARK_QUERY).addEventListener('change', callback, { signal });
}
