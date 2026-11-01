import { describe, expect, it } from 'vitest';

import { routeHref, routeOf } from '../site/src/lib/site-paths';

const PAGES = '/jlib/';
const DEV = '/';

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
