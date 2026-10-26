export type CodeLanguage = 'html' | 'css' | 'ts' | 'bash' | 'text';

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'tag'
  | 'attribute'
  | 'property'
  | 'function'
  | 'punctuation';

export type Token = { kind: TokenKind; text: string };
