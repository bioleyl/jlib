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
