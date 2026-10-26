import { describe, expect, it } from 'vitest';

import { matchesShortcut, parseShortcut, shortcutAria, shortcutLabels } from '../src/lib/key-shortcut';

import type { KeyShortcut } from '../src/types/key-shortcut.types';

const press = (
  key: string,
  modifiers: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>> = {}
) => ({
  altKey: false,
  ctrlKey: false,
  key,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
});

const shortcut = (text: string): KeyShortcut => {
  const parsed = parseShortcut(text);
  if (parsed === null) {
    throw new Error(`unreadable shortcut ${text}`);
  }
  return parsed;
};

describe('parseShortcut', () => {
  it('reads a single key', () => {
    expect(parseShortcut('/')).toEqual({
      alt: false,
      ctrl: false,
      key: '/',
      meta: false,
      mod: false,
      shift: false,
    });
  });

  it('reads modifiers in any case and with their other names', () => {
    expect(parseShortcut('Mod+K')).toMatchObject({ key: 'k', mod: true });
    expect(parseShortcut('cmd+shift+p')).toMatchObject({ key: 'p', meta: true, shift: true });
    expect(parseShortcut('control + option + x')).toMatchObject({ alt: true, ctrl: true, key: 'x' });
  });

  it('gives null without a key', () => {
    expect(parseShortcut('')).toBeNull();
    expect(parseShortcut('mod+')).toBeNull();
    expect(parseShortcut('shift')).toBeNull();
  });
});

describe('matchesShortcut', () => {
  it('matches mod with Ctrl elsewhere and with ⌘ on a Mac', () => {
    const modK = shortcut('mod+k');
    expect(matchesShortcut(press('k', { ctrlKey: true }), modK, false)).toBe(true);
    expect(matchesShortcut(press('k', { metaKey: true }), modK, false)).toBe(false);
    expect(matchesShortcut(press('K', { metaKey: true }), modK, true)).toBe(true);
    expect(matchesShortcut(press('k'), modK, true)).toBe(false);
  });

  it('ignores Shift for a single key, since some keyboards need it for "/"', () => {
    const slash = shortcut('/');
    expect(matchesShortcut(press('/'), slash, false)).toBe(true);
    expect(matchesShortcut(press('/', { shiftKey: true }), slash, false)).toBe(true);
    expect(matchesShortcut(press('/', { ctrlKey: true }), slash, false)).toBe(false);
  });

  it('compares Shift once a command modifier is involved', () => {
    expect(matchesShortcut(press('k', { ctrlKey: true, shiftKey: true }), shortcut('mod+k'), false)).toBe(false);
    expect(matchesShortcut(press('P', { metaKey: true, shiftKey: true }), shortcut('cmd+shift+p'), false)).toBe(
      true
    );
  });
});

describe('shortcutLabels and shortcutAria', () => {
  it('draws symbols on a Mac and names elsewhere', () => {
    expect(shortcutLabels(shortcut('mod+k'), true)).toEqual(['⌘', 'K']);
    expect(shortcutLabels(shortcut('mod+k'), false)).toEqual(['Ctrl', 'K']);
    expect(shortcutLabels(shortcut('ctrl+shift+p'), false)).toEqual(['Ctrl', 'Shift', 'P']);
    expect(shortcutLabels(shortcut('/'), false)).toEqual(['/']);
    expect(shortcutLabels(shortcut('escape'), false)).toEqual(['Esc']);
  });

  it('writes the shortcut as aria-keyshortcuts expects', () => {
    expect(shortcutAria(shortcut('mod+k'), false)).toBe('Control+K');
    expect(shortcutAria(shortcut('mod+k'), true)).toBe('Meta+K');
    expect(shortcutAria(shortcut('/'), false)).toBe('/');
  });
});
