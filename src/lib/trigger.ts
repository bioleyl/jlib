/*
 * Helpers for the components that open something from a slotted trigger (menus, popovers, tooltips): the trigger
 * lives in the page's DOM, the floating part in the component's shadow root.
 */

// The controls people can focus, among native elements.
const NATIVE_FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
// jlib exposes the main inner element of a component as `part="base"`: a jl-button's native button, for instance.
// A jl-button with an href has two (a button and a link), and hides the one it does not use.
const BASE_PART = '[part~="base"]:not([hidden])';

/**
 * The element that carries a trigger's accessible state: the inner `base` part of a component (where its focus
 * and its name are), or else the element itself.
 */
export function accessibleTarget(element: Element): Element {
  return element.shadowRoot?.querySelector(BASE_PART) ?? element;
}

/** Sets an ARIA attribute on a trigger, where screen readers read it; `null` removes it. */
export function setTriggerAria(element: Element, name: string, value: string | null): void {
  const target = accessibleTarget(element);
  if (value === null) {
    target.removeAttribute(name);
    return;
  }
  target.setAttribute(name, value);
}

/** The element that has the focus within a document or a shadow root, looking inside nested shadow roots. */
export function deepActiveElement(root: DocumentOrShadowRoot): Element | null {
  const active = root.activeElement;
  const inner = active?.shadowRoot ?? null;
  if (inner === null || inner.activeElement === null) {
    return active;
  }
  return deepActiveElement(inner);
}

/** A form-associated custom element (jl-input, jl-button…) is a control: its own `focus()` reaches its inside. */
const isFormComponent = (element: Element): boolean =>
  (element.constructor as { formAssociated?: boolean }).formAssociated === true;

const canFocus = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement
  && (element.matches(NATIVE_FOCUSABLE) || isFormComponent(element))
  && !element.matches(':disabled')
  && element.checkVisibility();

/** The first control people can focus among some elements and everything inside them, in document order. */
export function firstFocusable(elements: readonly Element[]): HTMLElement | null {
  const candidates = elements.flatMap((element) => [element, ...element.querySelectorAll('*')]);
  return candidates.find(canFocus) ?? null;
}
