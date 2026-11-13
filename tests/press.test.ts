import { describe, expect, it } from 'vitest';

import { pressButtonOf, tellPress } from '../src/lib/press';

/** An event as a listener cancels it: only what `tellPress` reads of it. */
const cancellable = (cancelled = false): Event => {
  const event = {
    defaultPrevented: cancelled,
    preventDefault: () => Object.assign(event, { defaultPrevented: true }),
  };
  return event as unknown as Event;
};

describe('pressButtonOf', () => {
  it('names the main button for a click, and the secondary one for a context menu, whatever asked for it', () => {
    expect(pressButtonOf({ button: 0, type: 'click' })).toBe('main');
    expect(pressButtonOf({ button: 2, type: 'contextmenu' })).toBe('secondary');
    // The keyboard's menu key and a long press ask for the menu with no button.
    expect(pressButtonOf({ button: 0, type: 'contextmenu' })).toBe('secondary');
  });

  it('names the auxiliary button for a middle click only: the right one said its press with the context menu', () => {
    expect(pressButtonOf({ button: 1, type: 'auxclick' })).toBe('auxiliary');
    expect(pressButtonOf({ button: 2, type: 'auxclick' })).toBeNull();
  });

  it('gives null for an event that is no press', () => {
    expect(pressButtonOf({ button: 0, type: 'pointerdown' })).toBeNull();
  });
});

describe('tellPress', () => {
  it('says whether a listener cancelled the event it was told', () => {
    const refused = cancellable();
    expect(tellPress(refused, () => refused.preventDefault())).toBe(true);
    expect(tellPress(cancellable(), () => undefined)).toBe(false);
  });

  it('does not take an event cancelled before it was told for a refusal', () => {
    expect(tellPress(cancellable(true), () => undefined)).toBe(false);
  });
});
