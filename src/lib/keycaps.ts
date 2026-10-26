import type { Keycap, KeyPlatform } from '../types/keycaps.types';

type KeyLooks = Record<KeyPlatform, Keycap>;

const same = (label: string, name: string): KeyLooks => ({ apple: { label, name }, other: { label, name } });

/** The keys drawn differently from their name, by canonical name. */
const NAMED_KEYS: Record<string, KeyLooks> = {
  alt: { apple: { label: '⌥', name: 'Option' }, other: { label: 'Alt', name: 'Alt' } },
  backspace: { apple: { label: '⌫', name: 'Delete' }, other: { label: 'Backspace', name: 'Backspace' } },
  capslock: { apple: { label: '⇪', name: 'Caps Lock' }, other: { label: 'Caps', name: 'Caps Lock' } },
  cmd: { apple: { label: '⌘', name: 'Command' }, other: { label: 'Win', name: 'Windows' } },
  ctrl: { apple: { label: '⌃', name: 'Control' }, other: { label: 'Ctrl', name: 'Control' } },
  delete: { apple: { label: '⌦', name: 'Forward Delete' }, other: { label: 'Del', name: 'Delete' } },
  down: same('↓', 'Down Arrow'),
  end: same('End', 'End'),
  enter: { apple: { label: '↩', name: 'Return' }, other: { label: 'Enter', name: 'Enter' } },
  esc: same('Esc', 'Escape'),
  home: same('Home', 'Home'),
  left: same('←', 'Left Arrow'),
  mod: { apple: { label: '⌘', name: 'Command' }, other: { label: 'Ctrl', name: 'Control' } },
  pagedown: same('PgDn', 'Page Down'),
  pageup: same('PgUp', 'Page Up'),
  right: same('→', 'Right Arrow'),
  shift: { apple: { label: '⇧', name: 'Shift' }, other: { label: 'Shift', name: 'Shift' } },
  space: same('Space', 'Space'),
  tab: { apple: { label: '⇥', name: 'Tab' }, other: { label: 'Tab', name: 'Tab' } },
  up: same('↑', 'Up Arrow'),
};

/** Other words for the same keys, as `KeyboardEvent.key` and people write them. */
const ALIASES: Record<string, string> = {
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  arrowup: 'up',
  command: 'cmd',
  control: 'ctrl',
  del: 'delete',
  escape: 'esc',
  meta: 'cmd',
  opt: 'alt',
  option: 'alt',
  return: 'enter',
};

// A plus splits keys, except the last character: "mod++" is Mod and the plus key.
const KEY_SEPARATOR = /\+(?=.)/;
const SPOKEN_SEPARATOR = '+';

const capitalize = (word: string): string => word.charAt(0).toLocaleUpperCase() + word.slice(1);

function keycapOf(key: string, platform: KeyPlatform): Keycap {
  const word = key.toLowerCase();
  const named = NAMED_KEYS[ALIASES[word] ?? word];
  if (named !== undefined) {
    return named[platform];
  }
  const label = capitalize(key);
  return { label, name: label };
}

/**
 * The keycaps of a shortcut written as "mod+shift+k", in its order: ⌘ ⇧ K on Apple platforms, Ctrl Shift K
 * elsewhere. `mod` is the command key of the platform.
 */
export function keycapsOf(keys: string, platform: KeyPlatform): Keycap[] {
  return keys
    .split(KEY_SEPARATOR)
    .map((key) => key.trim())
    .filter((key) => key !== '')
    .map((key) => keycapOf(key, platform));
}

/** A shortcut as a screen reader should say it: "Command+Shift+K". */
export const spokenKeys = (keycaps: readonly Keycap[]): string =>
  keycaps.map((keycap) => keycap.name).join(SPOKEN_SEPARATOR);
