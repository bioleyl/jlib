import { isSiteRoute, routeHref, routeOf } from '../lib/site-paths';

// Where the site is served from: `/jlib/` on GitHub Pages, `/` in development (Vite's `base`).
const BASE = import.meta.env.BASE_URL;

/** The address of one of the site's routes: `href={pageHref('/components/button')}`. */
export const pageHref = (route: string): string => routeHref(BASE, route);

/** The address of a file of `site/public`: `assetHref('syware-logo.svg')`. */
export const assetHref = (file: string): string => `${BASE}${file}`;

/** The route the window shows now: `/components/button`. */
export const currentRoute = (): string => routeOf(BASE, window.location.pathname);

/**
 * Shows another route without reloading the page: the address changes, and the router (which follows `popstate`)
 * mounts the page.
 */
export function navigate(route: string): void {
  window.history.pushState({}, '', pageHref(route));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** Calls back after every change of route, ours or the browser's back and forward, until the signal aborts. */
export function onRouteChange(callback: () => void, signal: AbortSignal): void {
  window.addEventListener('popstate', callback, { signal });
}

const PRIMARY_BUTTON = 0;

/** The link a click lands on, through shadow roots, when it is a plain click the page may take over. */
function linkOf(event: MouseEvent): HTMLAnchorElement | undefined {
  const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (event.defaultPrevented || event.button !== PRIMARY_BUTTON || modified) {
    return undefined;
  }
  return event
    .composedPath()
    .find(
      (target): target is HTMLAnchorElement => target instanceof HTMLAnchorElement && target.hasAttribute('href')
    );
}

/** Whether the browser should follow the link itself: another window, a download, a file or another site. */
const leftToBrowser = (link: HTMLAnchorElement): boolean =>
  (link.target !== '' && link.target !== '_self') || link.hasAttribute('download');

/**
 * Takes over clicks on links to the site's own routes, so they show the page without a reload. Links to a bare
 * `#` (the examples' placeholders) stay where they are.
 */
export function interceptLinks(signal: AbortSignal): void {
  document.addEventListener(
    'click',
    (event) => {
      const link = linkOf(event);
      if (link === undefined || leftToBrowser(link)) {
        return;
      }
      if ((link.getAttribute('href') ?? '').startsWith('#')) {
        event.preventDefault();
        return;
      }
      const url = new URL(link.href, window.location.href);
      if (!isSiteRoute(BASE, url, window.location.origin)) {
        return;
      }
      event.preventDefault();
      if (url.pathname !== window.location.pathname) {
        navigate(routeOf(BASE, url.pathname));
      }
    },
    { signal }
  );
}
