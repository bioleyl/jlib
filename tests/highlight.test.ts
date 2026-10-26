import { describe, expect, it } from 'vitest';

import { tokenize } from '../src/lib/highlight';

import type { Token, TokenKind } from '../src/types/highlight.types';

const kindsOf = (tokens: Token[], kind: TokenKind): string[] =>
  tokens.filter((token) => token.kind === kind).map((token) => token.text);

describe('tokenize', () => {
  it('keeps every character of the code, in order', () => {
    const code = `import { JlButton } from 'jlib';\nconst a = <JlButton label="Save" />; // done`;
    expect(
      tokenize(code, 'ts')
        .map((token) => token.text)
        .join('')
    ).toBe(code);
  });

  it('finds keywords, strings, comments and JSX tags in TypeScript', () => {
    const tokens = tokenize(`const label = 'Save'; // the text\n<JlButton label={label} />`, 'ts');
    expect(kindsOf(tokens, 'keyword')).toEqual(['const']);
    expect(kindsOf(tokens, 'string')).toEqual(["'Save'"]);
    expect(kindsOf(tokens, 'comment')).toEqual(['// the text']);
    expect(kindsOf(tokens, 'tag')).toEqual(['<JlButton', '/>']);
    expect(kindsOf(tokens, 'attribute')).toEqual(['label']);
  });

  it('tells tag names from attributes and values in HTML', () => {
    const tokens = tokenize('<jl-button variant="primary" disabled>Go</jl-button>', 'html');
    // Neighbouring tokens of one kind are joined: the closing tag is one span.
    expect(kindsOf(tokens, 'tag')).toEqual(['<jl-button', '>', '</jl-button>']);
    expect(kindsOf(tokens, 'attribute')).toEqual(['variant', 'disabled']);
    expect(kindsOf(tokens, 'string')).toEqual(['"primary"']);
    expect(kindsOf(tokens, 'plain').join('')).toContain('Go');
  });

  it('does not read text between tags as attributes', () => {
    const tokens = tokenize('<p>a = b</p>', 'html');
    expect(kindsOf(tokens, 'attribute')).toEqual([]);
  });

  it('finds custom properties, at-rules and values in CSS', () => {
    const tokens = tokenize(':root {\n  --jl-accent: #7c3aed;\n}\n@media (width > 600px) {}', 'css');
    expect(kindsOf(tokens, 'property')).toContain('--jl-accent');
    expect(kindsOf(tokens, 'number')).toContain('#7c3aed');
    expect(kindsOf(tokens, 'keyword')).toContain('@media');
  });

  it('finds the command and its flags in a shell line', () => {
    const tokens = tokenize('npm install jlib --save', 'bash');
    expect(kindsOf(tokens, 'function')).toEqual(['npm']);
    expect(kindsOf(tokens, 'attribute')).toEqual(['--save']);
  });

  it('gives plain text as one token, and nothing for no code', () => {
    expect(tokenize('just words', 'text')).toEqual([{ kind: 'plain', text: 'just words' }]);
    expect(tokenize('', 'ts')).toEqual([]);
  });
});
