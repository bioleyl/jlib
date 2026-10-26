import type { KeyShortcut } from '../types/key-shortcut.types';

type ModifierName = 'mod' | 'ctrl' | 'meta' | 'alt' | 'shift';

/** The words a shortcut may use for each modifier: "mod+k", "cmd+shift+p", "ctrl+/". */
const MODIFIER_WORDS: Record<string, ModifierName> = {
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

const SEPARATOR = '+';

const isModifierWord = (word: string): boolean => Object.hasOwn(MODIFIER_WORDS, word);

/** The keys a shortcut's state must match, from the pressed key's modifiers. */
type PressedKey = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>;

const MAC_SYMBOLS: Record<ModifierName, string> = { alt: '⌥', ctrl: '⌃', meta: '⌘', mod: '⌘', shift: '⇧' };
const PC_NAMES: Record<ModifierName, string> = {
  alt: 'Alt',
  ctrl: 'Ctrl',
  meta: 'Meta',
  mod: 'Ctrl',
  shift: 'Shift',
};
const ARIA_NAMES: Record<ModifierName, string> = {
  alt: 'Alt',
  ctrl: 'Control',
  meta: 'Meta',
  mod: 'Control',
  shift: 'Shift',
};
const MODIFIER_ORDER: readonly ModifierName[] = ['ctrl', 'alt', 'shift', 'mod', 'meta'];

/** Names of keys that read better than their `KeyboardEvent.key`. */
const KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  enter: '↵',
  escape: 'Esc',
};

/**
 * A shortcut from text such as "/", "mod+k" or "ctrl+shift+p". Returns null for empty text or a shortcut without
 * a key.
 */
export function parseShortcut(text: string): KeyShortcut | null {
  const parts = text
    .trim()
    .toLowerCase()
    .split(SEPARATOR)
    .map((part) => part.trim());
  const key = parts.at(-1) ?? '';
  if (key === '' || isModifierWord(key)) {
    return null;
  }
  const modifiers = new Set(
    parts
      .slice(0, -1)
      .filter(isModifierWord)
      .map((part) => MODIFIER_WORDS[part])
  );
  return {
    alt: modifiers.has('alt'),
    ctrl: modifiers.has('ctrl'),
    key,
    meta: modifiers.has('meta'),
    mod: modifiers.has('mod'),
    shift: modifiers.has('shift'),
  };
}

/** Whether the shortcut asks for a modifier other than Shift: such a shortcut is not typing. */
export const hasCommandModifier = (shortcut: KeyShortcut): boolean =>
  shortcut.mod || shortcut.ctrl || shortcut.meta || shortcut.alt;

/**
 * Whether a key press is the shortcut. `mod` is ⌘ on a Mac and Ctrl elsewhere. Shift is only compared when the
 * shortcut has another modifier or names it: "/" needs Shift on some keyboards, and the key already says "/".
 */
export function matchesShortcut(event: PressedKey, shortcut: KeyShortcut, mac: boolean): boolean {
  const wantsCtrl = shortcut.ctrl || (shortcut.mod && !mac);
  const wantsMeta = shortcut.meta || (shortcut.mod && mac);
  const shiftMatters = shortcut.shift || hasCommandModifier(shortcut);
  return (
    event.key.toLowerCase() === shortcut.key
    && event.ctrlKey === wantsCtrl
    && event.metaKey === wantsMeta
    && event.altKey === shortcut.alt
    && (!shiftMatters || event.shiftKey === shortcut.shift)
  );
}

const activeModifiers = (shortcut: KeyShortcut): ModifierName[] =>
  MODIFIER_ORDER.filter((modifier) => shortcut[modifier]);

const keyLabel = (key: string): string => KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key);

/** The keys to draw for a shortcut, one label per key: ["⌘", "K"] on a Mac, ["Ctrl", "K"] elsewhere. */
export function shortcutLabels(shortcut: KeyShortcut, mac: boolean): string[] {
  const names = mac ? MAC_SYMBOLS : PC_NAMES;
  return [...activeModifiers(shortcut).map((modifier) => names[modifier]), keyLabel(shortcut.key)];
}

/** The shortcut as `aria-keyshortcuts` writes it: "Control+K", "/". */
export function shortcutAria(shortcut: KeyShortcut, mac: boolean): string {
  const names = { ...ARIA_NAMES, mod: mac ? 'Meta' : 'Control' };
  const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  return [...activeModifiers(shortcut).map((modifier) => names[modifier]), key].join(SEPARATOR);
}
