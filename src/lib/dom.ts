/** Sets an attribute, or removes it when the value is empty. */
export function setOrRemove(element: Element, name: string, value: string): void {
  if (value === '') {
    element.removeAttribute(name);
    return;
  }
  element.setAttribute(name, value);
}

const sequence = { next: 0 };

/** A unique id within the page, for wiring `aria-controls`, `aria-labelledby` and the like inside a shadow root. */
export function uniqueId(prefix: string): string {
  sequence.next += 1;
  return `${prefix}-${sequence.next}`;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** An SVG element with its attributes: JSX makes HTML elements only. */
export function svgElement<Tag extends keyof SVGElementTagNameMap>(
  tag: Tag,
  attributes: Record<string, string>
): SVGElementTagNameMap[Tag] {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

/** Whether a click asks the browser for something of its own: a new tab or window, a download. */
export const isModifiedClick = (event: MouseEvent): boolean =>
  event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0;
