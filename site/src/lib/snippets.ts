import { compactJson } from './playground';

import type { PropDoc } from '../types/docs.types';

export type SnippetSource = {
  tag: string;
  className: string;
  attributes: Record<string, string | boolean>;
  content: string;
  props: readonly PropDoc[];
  /** The props of the jl-* elements of the children, when their docs are at hand: their values are then typed. */
  childProps?: (tag: string) => readonly PropDoc[] | undefined;
};

// The end of a line of a snippet file that sets up what the snippet needs (data, a page's function): the file
// type-checks with it, the page shows the snippet without it.
const NOT_SHOWN = '// (not shown)';

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

const NUMBER_TEXT = /^-?\d+(?:\.\d+)?$/;
const NUMBER_TYPE = /\bnumber\b/;
const LIST_TYPE = /\[\]$/;

const quoted = (value: string): string => `"${value.replaceAll('"', '&quot;')}"`;

/** A text as a string literal of code: single quotes, escaped. */
/**
 * A prop's value in JSX, from the text HTML writes, by the prop's type: a number or JSON as an expression, one value
 * of a list as a list of it, text quoted. Without the prop's doc, its type is guessed from the text.
 */
function jsxValue(prop: PropDoc | undefined, value: string): string {
  if (prop?.control?.kind === 'json' || isJson(value)) {
    return `{${compactJson(value)}}`;
  }
  const number = NUMBER_TEXT.test(value);
  if (prop === undefined) {
    return number ? `{${value}}` : quoted(value);
  }
  if (number && (prop.control?.kind === 'number' || NUMBER_TYPE.test(prop.type))) {
    return `{${value}}`;
  }
  // HTML writes one value of a list as it is (`value="open"`); JSX gives the list.
  if (LIST_TYPE.test(prop.type)) {
    return `{[${stringOf(value)}]}`;
  }
  return quoted(value);
}

/** A JSX prop: flags bare, the value by the prop's type. */
function jsxProp(props: readonly PropDoc[], [attribute, value]: [string, string | true]): string {
  const prop = propFor(props, attribute);
  const name = prop?.name ?? attribute;
  return value === true ? name : `${name}=${jsxValue(prop, value)}`;
}

// A style written on a component in the site's examples frames it there; Jadis's JSX types refuse a string for a
// class's style (1.8), and a view styles its components in its CSS: the JSX leaves it out.
const STAGING_ATTRIBUTE = 'style';

// A jl-* element of the children, empty, opening or closing; its attributes, each a name with an optional value.
const JL_EMPTY = /<(jl-[a-z-]+)((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*>\s*<\/\1>/g;
const JL_OPEN = /<(jl-[a-z-]+)((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*>/g;
const JL_CLOSE = /<\/(jl-[a-z-]+)>/g;
const ATTRIBUTE = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g;
const HYPHEN_PART = /-([a-z])/g;
// Attributes every element has, and the hyphenated ones JSX sets as attributes: written as they are.
const KEPT_ATTRIBUTES: ReadonlySet<string> = new Set(['class', 'id', 'role', 'slot', 'style', 'title']);
const ATTRIBUTE_PREFIX = /^(?:aria|data)-/;

/** A component's class, from its tag: jlib names them alike (`jl-tab-panel` is `JlTabPanel`). */
const classOf = (tag: string): string =>
  tag
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');

const camelCase = (name: string): string =>
  name.replace(HYPHEN_PART, (_match, letter: string) => letter.toUpperCase());

/**
 * An attribute of a jl-* child as a JSX prop: its name and value by the child's props when they are known, else
 * guessed (the camel case of the attribute, the value's type from its text). Flags bare.
 */
function childProp(name: string, value: string | undefined, props: readonly PropDoc[] | undefined): string {
  if (KEPT_ATTRIBUTES.has(name) || ATTRIBUTE_PREFIX.test(name)) {
    return value === undefined ? name : `${name}=${quoted(value)}`;
  }
  const prop = props === undefined ? undefined : propFor(props, name);
  const propName = prop?.name ?? camelCase(name);
  return value === undefined ? propName : `${propName}=${jsxValue(prop, value)}`;
}

const childPropsText = (attributes: string, props: readonly PropDoc[] | undefined): string =>
  [...attributes.matchAll(ATTRIBUTE)]
    .filter((match) => match[1] !== STAGING_ATTRIBUTE)
    .map((match) => ` ${childProp(match[1] ?? '', match[2] ?? match[3], props)}`)
    .join('');

/** Children written in HTML, as JSX: each jl-* element by its class, its attributes as props; the rest as it is. */
function jsxChildren(html: string, propsOf: SnippetSource['childProps']): string {
  const element = (tag: string, attributes: string, end: string): string =>
    `<${classOf(tag)}${childPropsText(attributes, propsOf?.(tag))}${end}`;
  return html
    .replace(JL_EMPTY, (_match, tag: string, attributes: string) => element(tag, attributes, ' />'))
    .replace(JL_OPEN, (_match, tag: string, attributes: string) => element(tag, attributes, '>'))
    .replace(JL_CLOSE, (_match, tag: string) => `</${classOf(tag)}>`);
}

/** The element in JSX, by its class and typed, its children too: the bundler keeps what a view names. */
export function jsxSnippet(source: SnippetSource): string {
  const content = jsxChildren(source.content.trim(), source.childProps);
  const props = writtenAttributes(source.attributes)
    .filter(([attribute]) => attribute !== STAGING_ATTRIBUTE)
    .map((entry) => jsxProp(source.props, entry));
  if (content === '') {
    return openingTag(source.className, props, true);
  }
  return wrapContent(openingTag(source.className, props, false), content, `</${source.className}>`);
}

/** The import a page needs for the components it names, each once, in order. */
export const importSnippet = (...classNames: string[]): string =>
  `import { ${[...new Set(classNames)].sort().join(', ')} } from '@syware/jlib';`;

/** The classes of the jl-* elements written in children, which a view in JSX imports too. */
export const childClasses = (html: string): string[] =>
  [...html.matchAll(JL_OPEN)].map((match) => classOf(match[1] ?? ''));

// Longer than this, a literal in an example's code puts each entry on its own line.
const MAX_LITERAL_LINE = 100;
const PLAIN_KEY = /^[A-Za-z_$][\w$]*$/;

const keyOf = (key: string): string => (PLAIN_KEY.test(key) ? key : `'${key}'`);

const stringOf = (text: string): string => `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

/** The entries worth writing: `undefined` ones are left out, as JSON leaves them out. */
const entriesOf = (value: object): [string, unknown][] =>
  Object.entries(value).filter((entry) => entry[1] !== undefined);

function inlineLiteral(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(inlineLiteral).join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = entriesOf(value).map(([key, item]) => `${keyOf(key)}: ${inlineLiteral(item)}`);
    return entries.length === 0 ? '{}' : `{ ${entries.join(', ')} }`;
  }
  return typeof value === 'string' ? stringOf(value) : String(value);
}

function literal(value: unknown, indent: string, used: number): string {
  const inline = inlineLiteral(value);
  if (used + inline.length <= MAX_LITERAL_LINE || typeof value !== 'object' || value === null) {
    return inline;
  }
  const inner = `${indent}${INDENT}`;
  if (Array.isArray(value)) {
    const items = value.map((item) => `${inner}${literal(item, inner, inner.length)},`);
    return `[\n${items.join('\n')}\n${indent}]`;
  }
  const entries = entriesOf(value).map(([key, item]) => {
    const head = `${inner}${keyOf(key)}: `;
    return `${head}${literal(item, inner, head.length)},`;
  });
  return `{\n${entries.join('\n')}\n${indent}}`;
}

/**
 * Data as a constant in an example's code, written as people write it: plain keys, single quotes, an object or a
 * list on one line when it fits, else one entry per line.
 */
export function constSnippet(name: string, value: unknown): string {
  const head = `const ${name} = `;
  return `${head}${literal(value, '', head.length)};`;
}

/** A snippet file as the page shows it: without the lines marked `// (not shown)`, nor the blank lines they leave. */
export function shownSnippet(source: string): string {
  return source
    .split('\n')
    .filter((line) => !line.trimEnd().endsWith(NOT_SHOWN))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
