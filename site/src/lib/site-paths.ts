// The site's addresses: routes like `/components/button` under the base the site is served from (`/jlib/` on GitHub
// Pages, `/` in development).

const TRAILING_SLASH = /\/+$/;
// A last segment with a dot names a file (`syware-logo.svg`), not a route.
const FILE_SEGMENT = /\/[^/]+\.[a-z0-9]+$/i;

/** The base without its trailing slash: `/jlib/` gives `/jlib`, `/` gives ``. */
const trimmed = (base: string): string => base.replace(TRAILING_SLASH, '');

/** The address of a route under the base: `/components/button` under `/jlib/` is `/jlib/components/button`. */
export function routeHref(base: string, route: string): string {
  const path = route.replace(TRAILING_SLASH, '');
  return path === '' ? `${trimmed(base)}/` : `${trimmed(base)}${path}`;
}

/** The route an address shows: `/jlib/components/button/` under `/jlib/` is `/components/button`. */
export function routeOf(base: string, pathname: string): string {
  const prefix = trimmed(base);
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  const route = rest.replace(TRAILING_SLASH, '');
  return route === '' ? '/' : route;
}

/** Whether a link goes to one of the site's own routes: same origin, under the base, and not a file. */
export function isSiteRoute(base: string, url: URL, origin: string): boolean {
  if (url.origin !== origin) {
    return false;
  }
  const prefix = trimmed(base);
  const underBase = url.pathname === prefix || url.pathname.startsWith(`${prefix}/`);
  return underBase && !FILE_SEGMENT.test(url.pathname);
}
