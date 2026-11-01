// The site's addresses: routes like `/components/button` under the base the site is served from (`/jlib/` on GitHub
// Pages, `/` in development).

const TRAILING_SLASH = /\/+$/;

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
