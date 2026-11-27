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

/** What stands under an element in the page: a slot's assigned elements, a shadow root's, or else its children. */
function shownChildren(element: Element): Element[] {
  if (element instanceof HTMLSlotElement && element.assignedElements().length > 0) {
    return element.assignedElements();
  }
  return [...(element.shadowRoot ?? element).children];
}

/** An element and everything under it as the page shows them, open shadow roots included, in the page's order. */
const shownTree = (element: Element): Element[] => [element, ...shownChildren(element).flatMap(shownTree)];

/**
 * The first control people can focus among some elements and everything inside them, in the page's order: a
 * component of the page whose fields are in its shadow root gives its first one.
 */
export function firstFocusable(elements: readonly Element[]): HTMLElement | null {
  return elements.flatMap(shownTree).find(canFocus) ?? null;
}
