import { describe, expect, it } from 'vitest';

import { keycapsOf, spokenKeys } from '../src/lib/keycaps';

const labels = (keys: string, platform: 'apple' | 'other'): string[] =>
  keycapsOf(keys, platform).map((keycap) => keycap.label);

describe('keycapsOf', () => {
  it('draws mod as the command key on Apple platforms and Ctrl elsewhere', () => {
    expect(labels('mod+shift+k', 'apple')).toEqual(['⌘', '⇧', 'K']);
    expect(labels('mod+shift+k', 'other')).toEqual(['Ctrl', 'Shift', 'K']);
  });

  it('reads aliases and any case', () => {
    expect(labels('Option+Escape', 'apple')).toEqual(['⌥', 'Esc']);
    expect(labels('CTRL + ArrowUp', 'other')).toEqual(['Ctrl', '↑']);
  });

  it('keeps a plus as the last key', () => {
    expect(labels('mod++', 'other')).toEqual(['Ctrl', '+']);
    expect(labels('+', 'other')).toEqual(['+']);
  });

  it('capitalizes unknown keys and drops empty ones', () => {
    expect(labels('f5', 'other')).toEqual(['F5']);
    expect(labels('', 'apple')).toEqual([]);
  });
});

describe('spokenKeys', () => {
  it('says the keys by name', () => {
    expect(spokenKeys(keycapsOf('mod+shift+k', 'apple'))).toBe('Command+Shift+K');
    expect(spokenKeys(keycapsOf('mod+enter', 'other'))).toBe('Control+Enter');
  });
});
