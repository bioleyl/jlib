import { describe, expect, it } from 'vitest';

import { accentCss } from '../site/src/lib/accent';
import { defaultValue, formatDetail, isValidJson } from '../site/src/lib/playground';
import { dedent } from '../src/lib/text';

describe('formatDetail', () => {
  it('shows nothing for an event without detail', () => {
    expect(formatDetail(undefined)).toBe('');
    expect(formatDetail(null)).toBe('');
  });

  it('shows values as JSON, cut when long', () => {
    expect(formatDetail('hello')).toBe('"hello"');
    expect(formatDetail({ id: 3 })).toBe('{"id":3}');
    expect(formatDetail('x'.repeat(200))).toHaveLength(90);
  });
});

describe('defaultValue', () => {
  it('reads documented defaults as control values', () => {
    expect(defaultValue("'md'")).toBe('md');
    expect(defaultValue("''")).toBe('');
    expect(defaultValue('false')).toBe(false);
    expect(defaultValue('true')).toBe(true);
    expect(defaultValue('16')).toBe('16');
  });
});

describe('isValidJson', () => {
  it('tells JSON from text', () => {
    expect(isValidJson('[1, 2]')).toBe(true);
    expect(isValidJson('[1, 2')).toBe(false);
  });
});

describe('dedent', () => {
  it('removes the shared indentation and the blank lines around', () => {
    expect(dedent('\n    a\n      b\n    c\n  ')).toBe('a\n  b\nc');
  });

  it('keeps text without indentation as it is', () => {
    expect(dedent('one\ntwo')).toBe('one\ntwo');
  });
});

describe('accentCss', () => {
  it('gives a rule for the root with the colour and its mixed shades', () => {
    const rule = accentCss('#7c3aed');
    expect(rule.startsWith(':root {\n')).toBe(true);
    expect(rule).toContain('--jl-accent: #7c3aed;');
    expect(rule).toContain('--jl-accent-soft: color-mix(');
  });
});
