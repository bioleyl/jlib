/** A stand-in that watches nothing, for a DOM without ResizeObserver (jsdom, which has no layout either). */
const INERT_OBSERVER: ResizeObserver = {
  disconnect: () => undefined,
  observe: () => undefined,
  unobserve: () => undefined,
};

/** Watches elements' sizes; where the DOM has no ResizeObserver, nothing changes size and nothing is watched. */
export const watchSizes = (callback: ResizeObserverCallback): ResizeObserver =>
  typeof ResizeObserver === 'function' ? new ResizeObserver(callback) : INERT_OBSERVER;
