import type { CodeLanguage, Token, TokenKind } from '../types/highlight.types';

/** One rule of a scanner: the first rule whose pattern matches at the current position gives the token. */
type Rule = { kind: TokenKind; pattern: RegExp };

const TS_KEYWORDS = [
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'of',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
];

const sticky = (source: string): RegExp => new RegExp(source, 'y');

const QUOTED_STRING = String.raw`'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"`;
const TEMPLATE_STRING = String.raw`\`(?:\\.|[^\`\\])*\``;

const TS_RULES: Rule[] = [
  { kind: 'comment', pattern: sticky(String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`) },
  { kind: 'string', pattern: sticky(`${QUOTED_STRING}|${TEMPLATE_STRING}`) },
  { kind: 'tag', pattern: sticky(String.raw`<\/?[A-Za-z][\w.-]*|\/?>`) },
  { kind: 'keyword', pattern: sticky(String.raw`\b(?:${TS_KEYWORDS.join('|')})\b`) },
  { kind: 'number', pattern: sticky(String.raw`\b\d[\d_]*(?:\.\d+)?\b`) },
  { kind: 'function', pattern: sticky(String.raw`[A-Za-z_$][\w$]*(?=\s*\()`) },
  { kind: 'attribute', pattern: sticky(String.raw`[A-Za-z_$][\w$-]*(?==[{"'])`) },
  { kind: 'plain', pattern: sticky(String.raw`[A-Za-z_$][\w$]*`) },
  { kind: 'punctuation', pattern: sticky(String.raw`[{}()[\];,.:=<>+\-*/!?&|]`) },
];

const CSS_RULES: Rule[] = [
  { kind: 'comment', pattern: sticky(String.raw`\/\*[\s\S]*?\*\/`) },
  { kind: 'string', pattern: sticky(String.raw`'[^'\n]*'|"[^"\n]*"`) },
  { kind: 'keyword', pattern: sticky(String.raw`@[\w-]+|!important`) },
  { kind: 'property', pattern: sticky(String.raw`--[\w-]+|[a-z-]+(?=\s*:[^:])`) },
  {
    kind: 'number',
    pattern: sticky(String.raw`#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|ms|s|vh|vw|dvh|fr|deg|turn)?\b`),
  },
  { kind: 'function', pattern: sticky(String.raw`[\w-]+(?=\()`) },
  { kind: 'tag', pattern: sticky(String.raw`:{1,2}[\w-]+|[.#][\w-]+|\b[a-z][\w-]*(?=[^{};]*\{)`) },
  { kind: 'punctuation', pattern: sticky(String.raw`[{}();:,>+~*[\]=]`) },
];

const BASH_RULES: Rule[] = [
  { kind: 'comment', pattern: sticky(String.raw`#[^\n]*`) },
  { kind: 'string', pattern: sticky(String.raw`'[^']*'|"(?:\\.|[^"\\])*"`) },
  { kind: 'attribute', pattern: sticky(String.raw`(?<=\s)--?[\w-]+`) },
  { kind: 'function', pattern: sticky(String.raw`(?<=^|\n|&&\s|\|\s)[\w.-]+`) },
  { kind: 'plain', pattern: sticky(String.raw`[^\s'"#]+`) },
];

const HTML_RULES: Rule[] = [
  { kind: 'comment', pattern: sticky(String.raw`<!--[\s\S]*?-->`) },
  { kind: 'tag', pattern: sticky(String.raw`<\/?[A-Za-z][\w-]*`) },
];

// Inside an HTML tag: attribute names, their values, and the equals sign between them.
const HTML_TAG_RULES: Rule[] = [
  { kind: 'string', pattern: sticky(`"[^"]*"|'[^']*'`) },
  { kind: 'attribute', pattern: sticky(String.raw`[^\s=>/"']+`) },
  { kind: 'punctuation', pattern: sticky('=') },
];

const SPACE: Rule = { kind: 'plain', pattern: sticky(String.raw`\s+`) };
const TAG_END: Rule = { kind: 'tag', pattern: sticky(String.raw`\/?>`) };

function matchAt(rules: Rule[], code: string, position: number): Token | null {
  for (const rule of rules) {
    rule.pattern.lastIndex = position;
    const match = rule.pattern.exec(code);
    if (match !== null && match[0] !== '') {
      return { kind: rule.kind, text: match[0] };
    }
  }
  return null;
}

/** What no rule matches is plain text, one character at a time. */
const nextToken = (rules: Rule[], code: string, position: number): Token =>
  matchAt(rules, code, position) ?? { kind: 'plain', text: code.charAt(position) };

/** Joins neighbouring tokens of the same kind, so the result has as few spans as it can. */
function merge(tokens: Token[]): Token[] {
  return tokens.reduce<Token[]>((merged, token) => {
    const last = merged.at(-1);
    if (last !== undefined && last.kind === token.kind) {
      last.text += token.text;
      return merged;
    }
    merged.push({ ...token });
    return merged;
  }, []);
}

/** Splits code with a flat list of rules. */
function scan(code: string, rules: Rule[]): Token[] {
  const withSpace = [SPACE, ...rules];
  const tokens: Token[] = [];
  let position = 0;
  while (position < code.length) {
    const token = nextToken(withSpace, code, position);
    tokens.push(token);
    position += token.text.length;
  }
  return merge(tokens);
}

const OUTSIDE_TAG = [SPACE, ...HTML_RULES];
const INSIDE_TAG = [TAG_END, SPACE, ...HTML_TAG_RULES];

/** HTML needs two states: outside a tag (text, comments, tag names) and inside one (attributes). */
function scanHtml(code: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  let insideTag = false;
  while (position < code.length) {
    const token = nextToken(insideTag ? INSIDE_TAG : OUTSIDE_TAG, code, position);
    insideTag = isInsideTagAfter(token, insideTag);
    tokens.push(token);
    position += token.text.length;
  }
  return merge(tokens);
}

/** A tag name opens a tag, `>` or `/>` closes it; any other token leaves the state as it was. */
function isInsideTagAfter(token: Token, insideTag: boolean): boolean {
  if (token.kind !== 'tag') {
    return insideTag;
  }
  return token.text.startsWith('<');
}

const SCANNERS: Record<CodeLanguage, (code: string) => Token[]> = {
  bash: (code) => scan(code, BASH_RULES),
  css: (code) => scan(code, CSS_RULES),
  html: scanHtml,
  text: (code) => [{ kind: 'plain', text: code }],
  ts: (code) => scan(code, TS_RULES),
};

/** Splits source code into coloured tokens. Small and forgiving: it draws code, it does not parse it. */
export function tokenize(code: string, language: CodeLanguage): Token[] {
  if (code === '') {
    return [];
  }
  return SCANNERS[language](code);
}

/** The tokens as spans with a `tok-<kind>` class each; plain text stays a text node. */
export function highlightedNodes(code: string, language: CodeLanguage): Node[] {
  return tokenize(code, language).map((token) => {
    if (token.kind === 'plain') {
      return document.createTextNode(token.text);
    }
    const span = document.createElement('span');
    span.className = `tok-${token.kind}`;
    span.textContent = token.text;
    return span;
  });
}
