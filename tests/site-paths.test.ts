import { describe, expect, it } from 'vitest';

import { isSiteRoute, routeHref, routeOf } from '../site/src/lib/site-paths';

const PAGES = '/jlib/';
const DEV = '/';
const ORIGIN = 'https://bioleyl.github.io';

describe('routeHref', () => {
  it('puts a route under the base', () => {
    expect(routeHref(PAGES, '/components/button')).toBe('/jlib/components/button');
    expect(routeHref(PAGES, '/')).toBe('/jlib/');
    expect(routeHref(DEV, '/components/button')).toBe('/components/button');
    expect(routeHref(DEV, '/')).toBe('/');
  });
});

describe('routeOf', () => {
  it('reads the route of an address, with or without a trailing slash', () => {
    expect(routeOf(PAGES, '/jlib/components/button')).toBe('/components/button');
    expect(routeOf(PAGES, '/jlib/components/button/')).toBe('/components/button');
    expect(routeOf(PAGES, '/jlib/')).toBe('/');
    expect(routeOf(PAGES, '/jlib')).toBe('/');
    expect(routeOf(DEV, '/design/logo')).toBe('/design/logo');
    expect(routeOf(DEV, '/')).toBe('/');
  });
});

describe('isSiteRoute', () => {
  const url = (path: string, origin = ORIGIN): URL => new URL(path, origin);

  it('accepts the routes under the base', () => {
    expect(isSiteRoute(PAGES, url('/jlib/components/button'), ORIGIN)).toBe(true);
    expect(isSiteRoute(PAGES, url('/jlib/'), ORIGIN)).toBe(true);
    expect(isSiteRoute(PAGES, url('/jlib'), ORIGIN)).toBe(true);
  });

  it('leaves files, other sites and other paths to the browser', () => {
    expect(isSiteRoute(PAGES, url('/jlib/syware-logo.svg'), ORIGIN)).toBe(false);
    expect(isSiteRoute(PAGES, url('/jlib/components/button', 'https://example.com'), ORIGIN)).toBe(false);
    expect(isSiteRoute(PAGES, url('/other/page'), ORIGIN)).toBe(false);
    expect(isSiteRoute(PAGES, url('/jlibrary'), ORIGIN)).toBe(false);
  });
});
