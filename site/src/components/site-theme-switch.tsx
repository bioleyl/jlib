import { css } from '@jadis/core';
import { JlElement, JlSegmented } from 'jlib';
import { BASE_STYLES } from 'jlib/styles/shared';

import { setTheme, storedTheme, themeBus } from '../services/theme';
import styles from './site-theme-switch.css?raw';

import type { SegmentedOption } from 'jlib';
import type { ThemeMode } from '../types/site.types';

const MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

const OPTIONS: SegmentedOption[] = [
  { icon: 'monitor', value: 'system' },
  { icon: 'sun', value: 'light' },
  { icon: 'moon', value: 'dark' },
];

const isMode = (value: string): value is ThemeMode => MODES.some((mode) => mode === value);

/** Light, dark, or the system's choice: a small segmented control in the top bar. */
export class SiteThemeSwitch extends JlElement {
  static readonly selector = 'site-theme-switch';

  private readonly _refs = this.useRefs((ref) => ({ choice: ref<JlSegmented>('jl-segmented') }));

  templateHtml(): Node {
    return <JlSegmented size="sm" label="Theme" options={OPTIONS} value={storedTheme()} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const choice = this._refs.choice;
    this.onBus(themeBus, 'changed', (mode) => choice.value.set(mode));
    choice.events.register('change', (value) => {
      if (isMode(value)) {
        setTheme(value);
      }
    });
  }
}

SiteThemeSwitch.register();
