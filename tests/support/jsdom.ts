// What the component suites that run in jsdom share: a wait for what components queue, and what jsdom lacks of a
// browser that they use.

const POPOVER_OPEN = ':popover-open';

/** A popover's toggle event, saying the state it goes to, as a browser sends it. */
const toggleEvent = (type: string, open: boolean): Event =>
  Object.assign(new Event(type), { newState: open ? 'open' : 'closed', oldState: open ? 'closed' : 'open' });

/**
 * The popover API (shown, hidden, `:popover-open`, `beforetoggle` before the change and `toggle` a task after it; no
 * light dismiss) and `checkVisibility`.
 */
export function fillBrowserGaps(): void {
  const shown = new WeakSet<Element>();
  const toggle = (popover: HTMLElement, open: boolean): void => {
    if (shown.has(popover) === open) {
      return;
    }
    popover.dispatchEvent(toggleEvent('beforetoggle', open));
    open ? shown.add(popover) : shown.delete(popover);
    setTimeout(() => popover.dispatchEvent(toggleEvent('toggle', open)));
  };
  HTMLElement.prototype.matches = function matches(this: HTMLElement, selectors: string) {
    return selectors === POPOVER_OPEN ? shown.has(this) : Element.prototype.matches.call(this, selectors);
  } as HTMLElement['matches'];
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    toggle(this, true);
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    toggle(this, false);
  };
  Element.prototype.checkVisibility = () => true;
}

/** Lets components draw what they queued: inputs draw on a microtask, onConnect and a popover's toggle a task later. */
export const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve));
  await new Promise((resolve) => setTimeout(resolve));
};
