import type { Hotkey, KeyPress } from '../types/hotkey.types';

const SEPARATOR = '+';

type Modifier = 'mod' | 'ctrl' | 'meta' | 'shift' | 'alt';

const MODIFIER_NAMES: Record<string, Modifier> = {
  alt: 'alt',
  cmd: 'meta',
  command: 'meta',
  control: 'ctrl',
  ctrl: 'ctrl',
  meta: 'meta',
  mod: 'mod',
  option: 'alt',
  shift: 'shift',
};

/** How each modifier reads on a keycap, on Apple keyboards and elsewhere. */
const MODIFIER_LABELS: Record<Modifier, { apple: string; other: string }> = {
  alt: { apple: '⌥', other: 'Alt' },
  ctrl: { apple: '⌃', other: 'Ctrl' },
  meta: { apple: '⌘', other: 'Win' },
  mod: { apple: '⌘', other: 'Ctrl' },
  shift: { apple: '⇧', other: 'Shift' },
};

/** The order keycaps are written in: ⌃⌥⇧⌘ on Apple, Ctrl+Alt+Shift elsewhere. */
const MODIFIER_ORDER: { apple: readonly Modifier[]; other: readonly Modifier[] } = {
  apple: ['ctrl', 'alt', 'shift', 'mod', 'meta'],
  other: ['mod', 'ctrl', 'alt', 'shift', 'meta'],
};

const KEY_LABELS: Record<string, string> = {
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  backspace: '⌫',
  enter: '↵',
  esc: 'Esc',
  escape: 'Esc',
  space: 'Space',
  tab: 'Tab',
};

/** Reads a combination such as `mod+k` or `ctrl+shift+p`: `mod` is ⌘ on Apple and Ctrl elsewhere. */
export function parseHotkey(text: string): Hotkey {
  const parts = text
    .toLowerCase()
    .split(SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const modifiers = new Set(parts.map((part) => MODIFIER_NAMES[part]).filter((name) => name !== undefined));
  const key = parts.filter((part) => MODIFIER_NAMES[part] === undefined).at(-1) ?? '';
  return {
    alt: modifiers.has('alt'),
    ctrl: modifiers.has('ctrl'),
    key,
    meta: modifiers.has('meta'),
    mod: modifiers.has('mod'),
    shift: modifiers.has('shift'),
  };
}

/** Whether a key press is the combination; extra modifiers make it another one. */
export function matchesHotkey(press: KeyPress, hotkey: Hotkey, apple: boolean): boolean {
  if (hotkey.key === '' || press.key.toLowerCase() !== hotkey.key) {
    return false;
  }
  const wantsCtrl = hotkey.ctrl || (hotkey.mod && !apple);
  const wantsMeta = hotkey.meta || (hotkey.mod && apple);
  return (
    press.ctrlKey === wantsCtrl
    && press.metaKey === wantsMeta
    && press.shiftKey === hotkey.shift
    && press.altKey === hotkey.alt
  );
}

function keyLabel(key: string): string {
  return KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1));
}

/** The keycaps of a combination, modifiers first: `['⌘', 'K']` on a Mac, `['Ctrl', 'K']` elsewhere. */
export function hotkeyLabels(text: string, apple: boolean): string[] {
  const hotkey = parseHotkey(text);
  const platform = apple ? 'apple' : 'other';
  const modifiers = MODIFIER_ORDER[platform]
    .filter((modifier) => hotkey[modifier])
    .map((modifier) => MODIFIER_LABELS[modifier][platform]);
  return hotkey.key === '' ? modifiers : [...modifiers, keyLabel(hotkey.key)];
}

/** Whether the keyboard has ⌘: Macs, iPhones and iPads. */
export function isApplePlatform(platform: string): boolean {
  return /mac|iphone|ipad|ipod/i.test(platform);
}
