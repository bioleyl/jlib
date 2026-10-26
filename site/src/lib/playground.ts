// How long an event's detail may be in the log before it is cut.
const MAX_DETAIL = 90;

/** An event's detail as one short line for the log: nothing for no detail, JSON for the rest. */
export function formatDetail(detail: unknown): string {
  if (detail === undefined || detail === null) {
    return '';
  }
  const text = describe(detail);
  return text.length > MAX_DETAIL ? `${text.slice(0, MAX_DETAIL - 1)}…` : text;
}

function describe(detail: unknown): string {
  if (typeof File !== 'undefined' && detail instanceof File) {
    return `File ${detail.name}`;
  }
  if (Array.isArray(detail) && detail.every((item) => typeof File !== 'undefined' && item instanceof File)) {
    return `[${detail.map((file: File) => file.name).join(', ')}]`;
  }
  try {
    return JSON.stringify(detail) ?? String(detail);
  } catch {
    return String(detail);
  }
}

/** Sets an attribute the way HTML writes it: a flag present or absent, an empty text as no attribute. */
export function applyAttribute(element: Element, name: string, value: string | boolean): void {
  if (value === false || value === '') {
    element.removeAttribute(name);
    return;
  }
  element.setAttribute(name, value === true ? '' : value);
}

/** Whether a text is JSON the playground can write to an attribute. */
export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

const QUOTED = /^'(.*)'$/;

/**
 * A property's documented default as a control shows it: `'md'` gives md, `false` gives false, `16` gives 16.
 * A control without an attribute set starts from it, so it never shows a value the component does not have.
 */
export function defaultValue(documented: string): string | boolean {
  if (documented === 'true' || documented === 'false') {
    return documented === 'true';
  }
  return QUOTED.exec(documented)?.[1] ?? documented;
}

/** JSON laid out on several lines for reading; text that is not JSON stays as it is. */
export function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** JSON on one line, for an attribute; text that is not JSON stays as it is. */
export function compactJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
}
