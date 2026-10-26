import { compactJson } from './playground';

import type { PropDoc } from '../types/docs.types';

export type SnippetSource = {
  tag: string;
  className: string;
  attributes: Record<string, string | boolean>;
  content: string;
  props: readonly PropDoc[];
};

// Longer than this on one line, a tag puts each attribute on its own line.
const MAX_INLINE = 72;
const INDENT = '  ';

/** The attributes worth writing: a false flag or an empty text is the same as no attribute. */
const writtenAttributes = (attributes: Record<string, string | boolean>): [string, string | true][] =>
  Object.entries(attributes).filter(
    (entry): entry is [string, string | true] => entry[1] !== false && entry[1] !== ''
  );

const escapeHtmlAttribute = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

const isJson = (value: string): boolean => /^\s*[[{]/.test(value);

function htmlAttribute([name, value]: [string, string | true]): string {
  if (value === true) {
    return name;
  }
  // JSON reads best between single quotes: its own double quotes then need no escaping.
  if (isJson(value)) {
    return `${name}='${compactJson(value).replaceAll("'", '&#39;')}'`;
  }
  return `${name}="${escapeHtmlAttribute(value)}"`;
}

const indent = (text: string): string =>
  text
    .split('\n')
    .map((line) => (line === '' ? line : `${INDENT}${line}`))
    .join('\n');

/** An opening tag, on one line when short, else one attribute per line. */
function openingTag(name: string, parts: string[], selfClosing: boolean): string {
  const end = selfClosing ? ' />' : '>';
  const inline = `<${name}${parts.map((part) => ` ${part}`).join('')}${end}`;
  if (inline.length <= MAX_INLINE || parts.length <= 1) {
    return inline;
  }
  return `<${name}\n${parts.map((part) => `${INDENT}${part}`).join('\n')}${selfClosing ? '\n/>' : '\n>'}`;
}

function wrapContent(open: string, content: string, close: string): string {
  if (content === '') {
    return `${open}${close}`;
  }
  if (!content.includes('\n') && open.length + content.length + close.length <= MAX_INLINE) {
    return `${open}${content}${close}`;
  }
  return `${open}\n${indent(content)}\n${close}`;
}

/** The element as HTML, as a page would write it. */
export function htmlSnippet(source: SnippetSource): string {
  const open = openingTag(source.tag, writtenAttributes(source.attributes).map(htmlAttribute), false);
  return wrapContent(open, source.content.trim(), `</${source.tag}>`);
}

const propFor = (props: readonly PropDoc[], attribute: string): PropDoc | undefined =>
  props.find((prop) => prop.attribute === attribute);

/** A JSX prop: flags bare, numbers and JSON as expressions, text quoted. */
function jsxProp(props: readonly PropDoc[], [attribute, value]: [string, string | true]): string {
  const prop = propFor(props, attribute);
  const name = prop?.name ?? attribute;
  if (value === true) {
    return name;
  }
  const kind = prop?.control?.kind;
  if (kind === 'number' || kind === 'json') {
    return `${name}={${compactJson(value)}}`;
  }
  return `${name}="${value.replaceAll('"', '&quot;')}"`;
}

/**
 * The element in JSX. Without children it is the class, typed; with children it is the tag, since a class
 * reference cannot take children in Jadis JSX.
 */
export function jsxSnippet(source: SnippetSource): string {
  const content = source.content.trim();
  const props = writtenAttributes(source.attributes).map((entry) => jsxProp(source.props, entry));
  if (content === '') {
    return openingTag(source.className, props, true);
  }
  const open = openingTag(source.tag, props, false);
  return wrapContent(open, content, `</${source.tag}>`);
}

/** The import a page needs for the component. */
export const importSnippet = (className: string): string => `import { ${className} } from 'jlib';`;
