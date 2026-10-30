import { describe, expect, it } from 'vitest';

import { constSnippet, htmlSnippet, importSnippet, jsxSnippet, shownSnippet } from '../site/src/lib/snippets';

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
    expect(importSnippet('JlButton')).toBe("import { JlButton } from '@syware/jlib';");
  });
});

describe('constSnippet', () => {
  it('writes short data on one line, with plain keys and single quotes', () => {
    expect(constSnippet('edge', { from: 'a', id: 'e1', note: "it's", to: 'b', 'x-y': 1 })).toBe(
      "const edge = { from: 'a', id: 'e1', note: 'it\\'s', to: 'b', 'x-y': 1 };"
    );
  });

  it('puts the entries of long data on their own lines, at every depth, and leaves undefined out', () => {
    const nodes = [
      { id: 'sent', label: 'Expense sent', position: { x: 0, y: 0 }, start: true },
      {
        id: 'check',
        label: 'Over 500?',
        note: undefined,
        ports: [{ id: 'yes', label: 'Yes' }],
        position: { x: 0, y: 136 },
      },
    ];
    expect(constSnippet('nodes', { edges: [], nodes })).toBe(`const nodes = {
  edges: [],
  nodes: [
    { id: 'sent', label: 'Expense sent', position: { x: 0, y: 0 }, start: true },
    {
      id: 'check',
      label: 'Over 500?',
      ports: [{ id: 'yes', label: 'Yes' }],
      position: { x: 0, y: 136 },
    },
  ],
};`);
  });
});

describe('shownSnippet', () => {
  it('leaves out the lines that only set the snippet up, and the blank lines they leave', () => {
    const source = [
      "import type { JlMenu } from '@syware/jlib';",
      '',
      'declare function rename(): void; // (not shown)',
      '',
      "const menu = document.querySelector<JlMenu<'rename'>>('jl-menu');",
      '',
    ].join('\n');
    expect(shownSnippet(source)).toBe(
      "import type { JlMenu } from '@syware/jlib';\n\nconst menu = document.querySelector<JlMenu<'rename'>>('jl-menu');"
    );
  });
});
