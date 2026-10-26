// The words the pattern pages are written with: a section and its blocks, in the order they read.
import type { CodeLanguage } from '@syware/jlib';
import type { Guideline, PatternBlock, PatternSection, RichText } from '../types/patterns.types';

export const section = (heading: string, ...blocks: PatternBlock[]): PatternSection => ({ blocks, heading });

export const text = (value: RichText): PatternBlock => ({ kind: 'text', text: value });

export const list = (...items: RichText[]): PatternBlock => ({ items, kind: 'list' });

/** What to do beside what not to: each a live preview, with the sentence that says why. */
export const rules = (good: Guideline, bad: Guideline): PatternBlock => ({ do: good, dont: bad, kind: 'rules' });

export const preview = (html: string, caption?: RichText): PatternBlock =>
  caption === undefined ? { html, kind: 'preview' } : { caption, html, kind: 'preview' };

/** A table: its headings, then its rows, the first cell of each naming the case. */
export const table = (head: readonly string[], ...rows: (readonly RichText[])[]): PatternBlock => ({
  head,
  kind: 'table',
  rows,
});

export const note = (value: RichText): PatternBlock => ({ kind: 'note', text: value });

export const code = (language: CodeLanguage, source: string): PatternBlock => ({
  code: source,
  kind: 'code',
  language,
});
