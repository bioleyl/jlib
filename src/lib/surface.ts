// What handles a press itself: a press on it is not a press on the card or the row around it.
const CONTROL_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'label',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="menuitem"]',
].join(', ');

const ACTIVATION_KEYS = ['Enter', ' '];

/**
 * Whether an event started on a control inside an interactive surface (a button in a card's footer, a switch at
 * the end of a row), across shadow roots: the surface then leaves the press to that control.
 */
export function startedOnControl(event: Event, surface: Element): boolean {
  const path = event.composedPath();
  const inside = path.slice(0, Math.max(0, path.indexOf(surface)));
  return inside.some((target) => target instanceof Element && target.matches(CONTROL_SELECTOR));
}

/** Whether a key activates a focused button-like surface, as Enter and Space do a native button. */
export const isActivationKey = (event: KeyboardEvent): boolean => ACTIVATION_KEYS.includes(event.key);
