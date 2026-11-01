import { routeHref, routeOf } from '../lib/site-paths';

// Where the site is served from: `/jlib/` on GitHub Pages, `/` in development (Vite's `base`).
const BASE = import.meta.env.BASE_URL;

/** The address of one of the site's routes: `href={pageHref('/components/button')}`. */
export const pageHref = (route: string): string => routeHref(BASE, route);

/** The address of a file of `site/public`: `assetHref('syware-logo.svg')`. */
export const assetHref = (file: string): string => `${BASE}${file}`;

/** The route the window shows now: `/components/button`. */
export const currentRoute = (): string => routeOf(BASE, window.location.pathname);

const HASH = '#';

/** Whether a click lands on a link to a place in the page (`#`, the examples' placeholders), through shadow roots. */
const isHashLink = (event: MouseEvent): boolean =>
  event
    .composedPath()
    .some((target) => target instanceof HTMLAnchorElement && (target.getAttribute('href') ?? '').startsWith(HASH));

/**
 * Keeps the links to a place in the page where they are: the router would show the page again, from scratch, for
 * each. It listens before the router (capture), which leaves a click already handled alone.
 */
export function holdHashLinks(signal: AbortSignal): void {
  document.addEventListener(
    'click',
    (event) => {
      if (!isHashLink(event)) {
        return;
      }
      event.preventDefault();
    },
    { capture: true, signal }
  );
}
