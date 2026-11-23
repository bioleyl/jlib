// What the combobox suites share: options, and reading and driving a combobox as people do.
import { settle } from './jsdom';

import type { JlChip } from '../../src/atoms/jl-chip';
import type { ComboboxOption } from '../../src/types/jl-combobox.types';

export const CITIES: ComboboxOption[] = [
  { label: 'Bern', value: 'be' },
  { label: 'Biel/Bienne', value: 'bi' },
  { label: 'Zürich', value: 'zh' },
];

/** The answer of a server that found "zur" in a city's other names too: Bern has no "zur" in its label. */
export const FOUND: ComboboxOption[] = [
  { label: 'Zürich', value: 'zh' },
  { label: 'Bern', value: 'be' },
];

export function rootOf(combobox: HTMLElement): ShadowRoot {
  if (combobox.shadowRoot === null) {
    throw new Error('The combobox has no shadow root');
  }
  return combobox.shadowRoot;
}

export function nativeOf(combobox: HTMLElement): HTMLInputElement {
  const native = rootOf(combobox).querySelector('input');
  if (native === null) {
    throw new Error('The combobox has no field');
  }
  return native;
}

/** Types a text as people do: the field's value, then its input event. */
export async function type(combobox: HTMLElement, text: string): Promise<void> {
  const native = nativeOf(combobox);
  native.focus();
  native.value = text;
  native.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
}

export async function press(combobox: HTMLElement, key: string): Promise<void> {
  nativeOf(combobox).dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
  await settle();
}

export const isOpen = (combobox: HTMLElement): boolean =>
  rootOf(combobox).querySelector('.popup')?.matches(':popover-open') ?? false;

export const shownLabels = (combobox: HTMLElement): string[] =>
  [...rootOf(combobox).querySelectorAll('.listbox .option-label')].map((label) => label.textContent ?? '');

export const isShown = (combobox: HTMLElement, selector: string): boolean =>
  rootOf(combobox).querySelector<HTMLElement>(selector)?.hidden === false;

export const statusOf = (combobox: HTMLElement): string =>
  rootOf(combobox).querySelector('.status')?.textContent ?? '';

export const chipsOf = (combobox: HTMLElement): JlChip[] => [
  ...rootOf(combobox).querySelectorAll<JlChip>('.chips jl-chip'),
];

export async function pressOption(combobox: HTMLElement, label: string): Promise<void> {
  const option = [...rootOf(combobox).querySelectorAll<HTMLElement>('.listbox .option')].find(
    (item) => item.querySelector('.option-label')?.textContent === label
  );
  option?.click();
  await settle();
}
