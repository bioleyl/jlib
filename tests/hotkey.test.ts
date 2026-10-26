import { describe, expect, it } from 'vitest';

import { hotkeyLabels, isApplePlatform, matchesHotkey, parseHotkey } from '../src/lib/hotkey';

const press = (
  key: string,
  modifiers: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>>
) => ({
  altKey: false,
  ctrlKey: false,
  key,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
});

describe('parseHotkey', () => {
  it('reads the modifiers and the key', () => {
    expect(parseHotkey('mod+shift+K')).toEqual({
      alt: false,
      ctrl: false,
      key: 'k',
      meta: false,
      mod: true,
      shift: true,
    });
    expect(parseHotkey('Ctrl + Alt + Delete')).toMatchObject({ alt: true, ctrl: true, key: 'delete' });
    expect(parseHotkey('cmd+/')).toMatchObject({ key: '/', meta: true });
  });
});

describe('matchesHotkey', () => {
  const modK = parseHotkey('mod+k');

  it('reads mod as ⌘ on Apple and Ctrl elsewhere', () => {
    expect(matchesHotkey(press('k', { metaKey: true }), modK, true)).toBe(true);
    expect(matchesHotkey(press('k', { ctrlKey: true }), modK, true)).toBe(false);
    expect(matchesHotkey(press('k', { ctrlKey: true }), modK, false)).toBe(true);
    expect(matchesHotkey(press('K', { ctrlKey: true }), modK, false)).toBe(true);
  });

  it('does not match with another key or extra modifiers', () => {
    expect(matchesHotkey(press('j', { ctrlKey: true }), modK, false)).toBe(false);
    expect(matchesHotkey(press('k', { ctrlKey: true, shiftKey: true }), modK, false)).toBe(false);
    expect(matchesHotkey(press('k', {}), parseHotkey('mod'), false)).toBe(false);
  });
});

describe('hotkeyLabels', () => {
  it('draws the keycaps for the platform', () => {
    expect(hotkeyLabels('mod+k', true)).toEqual(['⌘', 'K']);
    expect(hotkeyLabels('mod+k', false)).toEqual(['Ctrl', 'K']);
    expect(hotkeyLabels('mod+shift+p', true)).toEqual(['⇧', '⌘', 'P']);
    expect(hotkeyLabels('mod+shift+p', false)).toEqual(['Ctrl', 'Shift', 'P']);
    expect(hotkeyLabels('shift+enter', false)).toEqual(['Shift', '↵']);
    expect(hotkeyLabels('f2', false)).toEqual(['F2']);
  });
});

describe('isApplePlatform', () => {
  it('knows Apple platforms', () => {
    expect(isApplePlatform('MacIntel')).toBe(true);
    expect(isApplePlatform('iPhone')).toBe(true);
    expect(isApplePlatform('Win32')).toBe(false);
    expect(isApplePlatform('Linux x86_64')).toBe(false);
  });
});
