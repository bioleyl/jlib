import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Browser, Page } from 'playwright-core';
import type { PreviewServer } from 'vite';

const ROOT = join(import.meta.dirname, '..');
const DOCS = join(ROOT, 'site', 'src', 'docs', 'components');
const GUIDES = ['/', '/getting-started', '/tree-shaking', '/theming', '/forms', '/components'];
const DESIGN = [
  '',
  '/logo',
  '/colour',
  '/typography',
  '/spacing',
  '/shape',
  '/motion',
  '/icons',
  '/accessibility',
  '/writing',
].map((page) => `/design${page}`);
// Long enough for a page's components to connect and draw (onConnect runs a task after connection).
const SETTLE_MS = 300;
const ICON_WARNING = 'jl-icon:';

const componentPaths = readdirSync(DOCS)
  .filter((file) => file.endsWith('.doc.ts'))
  .map((file) => `/components/${file.replace(/^jl-/, '').replace(/\.doc\.ts$/, '')}`);

/** Every jl-* element of the page, through every shadow root, whose tag no component defines. */
const UNDEFINED_TAGS = `(() => {
  const missing = new Set();
  const visit = (root) => {
    for (const element of root.querySelectorAll('*')) {
      if (element.localName.startsWith('jl-') && !customElements.get(element.localName)) {
        missing.add(element.localName);
      }
      if (element.shadowRoot) visit(element.shadowRoot);
      if (element.localName === 'template') visit(element.content);
    }
  };
  visit(document);
  return [...missing];
})()`;

const state = {
  base: '',
  browser: null as Browser | null,
  errors: [] as string[],
  page: null as Page | null,
  server: null as PreviewServer | null,
};

async function open(path: string): Promise<Page> {
  const page = state.page;
  if (page === null) {
    throw new Error('The browser did not start');
  }
  state.errors = [];
  await page.goto(new URL(path.slice(1), state.base).href);
  await page.waitForTimeout(SETTLE_MS);
  return page;
}

beforeAll(async () => {
  state.server = await preview({
    configFile: join(ROOT, 'site', 'vite.config.ts'),
    logLevel: 'error',
    preview: { port: 0, strictPort: false },
  });
  state.base = state.server.resolvedUrls?.local[0] ?? '';
  state.browser = await chromium.launch();
  state.page = await state.browser.newPage();
  state.page.on('console', (message) => {
    // An icon a page names without registering it is a mistake in the docs too.
    if (message.type() === 'error' || message.text().startsWith(ICON_WARNING)) {
      state.errors.push(message.text());
    }
  });
  state.page.on('pageerror', (error) => state.errors.push(error.message));
});

afterAll(async () => {
  await state.browser?.close();
  await new Promise<void>((resolve) => state.server?.httpServer.close(() => resolve()));
});

describe('every page of the site', () => {
  it.each([...GUIDES, ...DESIGN, ...componentPaths])(
    '%s renders without errors and with every tag defined',
    async (path) => {
      const page = await open(path);
      expect(state.errors).toEqual([]);
      expect(await page.evaluate(UNDEFINED_TAGS)).toEqual([]);
    }
  );
});

describe('the forms page', () => {
  it('submits the fields as FormData, like native ones', async () => {
    const page = await open('/forms');
    const data = await page.evaluate(`(async () => {
      const root = document.querySelector('site-shell > div > *').shadowRoot;
      const form = root.querySelector('form');
      const email = root.querySelector('jl-input[name="email"]');
      email.value.set('ada@example.com');
      root.querySelector('jl-checkbox[name="terms"]').checked.set(true);
      return Object.fromEntries(new FormData(form));
    })()`);
    expect(data).toMatchObject({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      plan: 'team',
      role: 'developer',
    });
  });
});

describe('the theme switch', () => {
  it('puts the whole page in dark mode', async () => {
    const page = await open('/');
    await page.evaluate(`(() => {
      const shell = document.querySelector('site-shell').shadowRoot;
      const choice = shell.querySelector('site-theme-switch').shadowRoot.querySelector('jl-segmented');
      const dark = [...choice.shadowRoot.querySelectorAll('[role="radio"]')].find((option) => option.title === 'dark');
      dark.click();
    })()`);
    expect(await page.evaluate('document.documentElement.dataset.theme')).toBe('dark');
    expect(await page.evaluate('getComputedStyle(document.body).backgroundColor')).toBe('rgb(15, 17, 19)');
  });
});

describe('the routes', () => {
  it('open a page from its own address, as a link from elsewhere does', async () => {
    const page = await open('/components/button');
    expect(await page.evaluate("document.querySelector('site-shell > div > *').localName")).toBe(
      'site-component-page'
    );
    expect(await page.evaluate('document.title')).toBe('Button · jlib');
  });

  it('follow a link without reloading the page', async () => {
    const page = await open('/components');
    await page.evaluate('window.stillTheSamePage = true');
    await page.evaluate(`(() => {
      const list = document.querySelector('site-shell > div > *').shadowRoot;
      list.querySelector('a.tile[href$="/components/badge"]').click();
    })()`);
    await page.waitForTimeout(SETTLE_MS);
    expect(new URL(page.url()).pathname.endsWith('/components/badge')).toBe(true);
    expect(await page.evaluate('window.stillTheSamePage')).toBe(true);
    expect(await page.evaluate('document.title')).toBe('Badge · jlib');
  });

  it('show the not-found page for an address the site does not have', async () => {
    const page = await open('/no-such-page');
    expect(await page.evaluate("document.querySelector('site-shell > div > *').localName")).toBe(
      'site-not-found-page'
    );
  });
});
