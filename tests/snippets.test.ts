import { describe, expect, it } from 'vitest';

import { htmlSnippet, importSnippet, jsxSnippet } from '../site/src/lib/snippets';

import type { PropDoc } from '../site/src/types/docs.types';

const PROPS: PropDoc[] = [
  { attribute: 'label', control: { kind: 'text' }, default: "''", description: '', name: 'label', type: 'string' },
  {
    attribute: 'icon-end',
    control: { kind: 'text' },
    default: "''",
    description: '',
    name: 'iconEnd',
    type: 'string',
  },
  { attribute: 'size', control: { kind: 'number' }, default: '16', description: '', name: 'size', type: 'number' },
  { attribute: 'items', control: { kind: 'json' }, default: '[]', description: '', name: 'items', type: 'Item[]' },
  {
    attribute: 'disabled',
    control: { kind: 'boolean' },
    default: 'false',
    description: '',
    name: 'disabled',
    type: 'boolean',
  },
];

const source = (attributes: Record<string, string | boolean>, content = '') => ({
  attributes,
  className: 'JlThing',
  content,
  props: PROPS,
  tag: 'jl-thing',
});

describe('htmlSnippet', () => {
  it('writes text attributes quoted and flags bare, and leaves out false and empty ones', () => {
    expect(htmlSnippet(source({ disabled: true, hidden: false, label: 'Save', placeholder: '' }))).toBe(
      '<jl-thing disabled label="Save"></jl-thing>'
    );
  });

  it('writes JSON between single quotes', () => {
    expect(htmlSnippet(source({ items: '[{"label":"A"}]' }))).toBe(
      `<jl-thing items='[{"label":"A"}]'></jl-thing>`
    );
  });

  it('escapes quotes in text values', () => {
    expect(htmlSnippet(source({ label: 'Say "hi"' }))).toBe('<jl-thing label="Say &quot;hi&quot;"></jl-thing>');
  });

  it('puts each attribute on its own line when the tag is long, and indents the content', () => {
    const snippet = htmlSnippet(
      source(
        { 'icon-end': 'arrow-right', label: 'A rather long label for a button', size: '18' },
        '<b>Hi</b>\n<i>there</i>'
      )
    );
    expect(snippet).toBe(
      [
        '<jl-thing',
        '  icon-end="arrow-right"',
        '  label="A rather long label for a button"',
        '  size="18"',
        '>',
        '  <b>Hi</b>',
        '  <i>there</i>',
        '</jl-thing>',
      ].join('\n')
    );
  });
});

describe('jsxSnippet', () => {
  it('uses the class and property names, numbers and JSON as expressions', () => {
    expect(jsxSnippet(source({ 'icon-end': 'x', items: '[ {"a": 1} ]', size: '18' }))).toBe(
      '<JlThing iconEnd="x" items={[{"a":1}]} size={18} />'
    );
  });

  it('uses the tag when the element has children', () => {
    expect(jsxSnippet(source({ label: 'Go' }, 'Hello'))).toBe('<jl-thing label="Go">Hello</jl-thing>');
  });
});

describe('importSnippet', () => {
  it('imports the class from the package', () => {
    expect(importSnippet('JlButton')).toBe("import { JlButton } from 'jlib';");
  });
});
