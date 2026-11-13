import type { PressButton } from '../types/press.types';

const MIDDLE_BUTTON = 1;

/**
 * The button each of the browser's events stands for. The secondary one is its `contextmenu`, which the keyboard's
 * menu key and a long press fire too, with no button of their own; an `auxclick` is told for the middle button
 * only, the right one having said its press already.
 */
const PRESS_BUTTONS: Record<string, (event: Pick<MouseEvent, 'button'>) => PressButton | null> = {
  auxclick: (event) => (event.button === MIDDLE_BUTTON ? 'auxiliary' : null),
  click: () => 'main',
  contextmenu: () => 'secondary',
};

/** The button of the press an event of the browser is; null for an event that is no press. */
export const pressButtonOf = (event: Pick<MouseEvent, 'button' | 'type'>): PressButton | null =>
  PRESS_BUTTONS[event.type]?.(event) ?? null;

/** The browser's events a press on a row or an item comes as: the main button, the middle one, the request for a menu. */
export const PRESS_EVENTS = ['click', 'auxclick', 'contextmenu'] as const;

/**
 * Tells a press to the page.
 * @returns Whether the page refused it: a listener cancelled the browser's event (`event.preventDefault()`), which
 * keeps the browser's own menu away too. An event cancelled before it was told is not a refusal.
 */
export function tellPress(event: Event, tell: () => void): boolean {
  const cancelledBefore = event.defaultPrevented;
  tell();
  return !cancelledBefore && event.defaultPrevented;
}
