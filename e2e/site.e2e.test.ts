import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Browser, Page } from 'playwright-core';
import type { PreviewServer } from 'vite';
import type { JlDatePicker } from '../src/molecules/jl-date-picker';
import type { JlFlow } from '../src/organisms/jl-flow';

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
const PATTERN_DOCS = join(ROOT, 'site', 'src', 'docs', 'patterns');
const PATTERN_PATH = /path: '(\/patterns\/[^']+)'/;
// A phone, and how long a finger holds a tooltip's trigger (its long press is 500 ms) and waits for it to go (1.5 s).
const PHONE = { height: 844, width: 390 };
const LONG_PRESS_WAIT_MS = 700;
const TOUCH_LINGER_WAIT_MS = 1800;
// Long enough for a page's components to connect and draw (onConnect runs a task after connection).
const SETTLE_MS = 300;
const ICON_WARNING = 'jl-icon:';
// A node's height and the gap below it: the flow's layout puts nodes on rows this far apart.
const FLOW_ROW = 136;

const componentPaths = readdirSync(DOCS)
  .filter((file) => file.endsWith('.doc.ts'))
  .map((file) => `/components/${file.replace(/^jl-/, '').replace(/\.doc\.ts$/, '')}`);

const patternPaths = [
  '/patterns',
  ...readdirSync(PATTERN_DOCS).flatMap(
    (file) => PATTERN_PATH.exec(readFileSync(join(PATTERN_DOCS, file), 'utf8'))?.[1] ?? []
  ),
];

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
  it.each([...GUIDES, ...DESIGN, ...patternPaths, ...componentPaths])(
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

describe('the date picker', () => {
  it('refuses letters, and reads a date typed in digits, the number keys up on phones', async () => {
    const page = await open('/components/date-picker');
    const picker = page.locator('jl-date-picker.demo-due');
    const field = picker.locator('input');
    expect(await field.getAttribute('inputmode')).toBe('decimal');
    await field.click();
    await page.keyboard.type('Hllb');
    expect(await field.inputValue()).toBe('');
    await page.keyboard.type('01012030');
    await page.keyboard.press('Enter');
    expect(await picker.evaluate((element) => (element as JlDatePicker).value.get())).toBe('2030-01-01');
    expect(await field.inputValue()).toBe('01/01/2030');
    expect(state.errors).toEqual([]);
  });
});

describe('the timeline', () => {
  it('runs its line through the centre of every marker', async () => {
    const page = await open('/components/timeline');
    const offsets = await page
      .locator('jl-timeline')
      .first()
      .evaluate((host) =>
        [...(host.shadowRoot?.querySelectorAll('.event:not(:last-child)') ?? [])].map((event) => {
          const marker = event.querySelector('.marker')?.getBoundingClientRect();
          const line = getComputedStyle(event, '::before');
          const lineX =
            event.getBoundingClientRect().left + Number.parseFloat(line.left) + Number.parseFloat(line.width) / 2;
          return marker === undefined ? Number.NaN : Math.abs(marker.left + marker.width / 2 - lineX);
        })
      );
    expect(offsets.length).toBeGreaterThan(0);
    expect(Math.max(...offsets)).toBeLessThan(1);
  });
});

describe('the flow editor', () => {
  it('joins an exit to a node by dragging, and removes the edge with Delete', async () => {
    const page = await open('/components/flow');
    // Playwright's locators see through shadow roots.
    const flow = page.locator('jl-flow.expenses');
    await flow.scrollIntoViewIfNeeded();
    const edges = (): Promise<number> => flow.evaluate((element) => (element as JlFlow).graph.get().edges.length);
    const before = await edges();
    const from = await flow.locator('[data-node="pay"] .dot').boundingBox();
    const to = await flow.locator('[data-node="tell"] .label').boundingBox();
    if (from === null || to === null) {
      throw new Error('The example has no "pay" exit or "tell" node');
    }
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await edges()).toBe(before + 1);

    const line = await flow.locator('[data-edge="e1"] .edge-hit').boundingBox();
    if (line === null) {
      throw new Error('The example has no edge e1');
    }
    await page.mouse.click(line.x + line.width / 2, line.y + line.height / 2);
    await page.keyboard.press('Delete');
    expect(await edges()).toBe(before);

    // The wand puts every node on a row of the layout.
    await flow.locator('.tidy').click();
    // The callback runs in the page: the row height goes in as an argument.
    const rows = await flow.evaluate(
      (element, row) => (element as JlFlow).graph.get().nodes.map((node) => node.position.y % row),
      FLOW_ROW
    );
    expect(new Set(rows)).toEqual(new Set([0]));
    expect(state.errors).toEqual([]);
  });

  it('asks for one node where a step from the page is dropped', async () => {
    const page = await open('/components/flow');
    const flow = page.locator('jl-flow.dropped');
    await flow.scrollIntoViewIfNeeded();
    const labels = (): Promise<string[]> =>
      flow.evaluate((element) => (element as JlFlow).graph.get().nodes.map((node) => node.label));
    const box = await flow.boundingBox();
    if (box === null) {
      throw new Error('The example has no flow to drop on');
    }
    await page
      .locator('jl-chip[data-step="Wait a day"]')
      .dragTo(flow, { targetPosition: { x: box.width / 4, y: box.height / 4 } });
    // The page heard the flow's drop alone, not the browser's own drop crossing the shadow root as well.
    expect(await labels()).toEqual(['Start', 'Wait a day']);
    expect(state.errors).toEqual([]);
  });
});

describe('the tooltip', () => {
  it("shows its bubble alone: the button's own title steps aside while pointed at, and comes back", async () => {
    const page = await open('/components/tooltip');
    const tooltip = page.locator('jl-tooltip[text="Bold (⌘B)"]');
    const look = (tooltip: Element) => ({
      open: tooltip.shadowRoot?.querySelector('.bubble')?.matches(':popover-open'),
      title: tooltip.querySelector('jl-button')?.shadowRoot?.querySelector('button')?.getAttribute('title'),
    });
    await tooltip.scrollIntoViewIfNeeded();
    await tooltip.hover();
    await page.waitForTimeout(SETTLE_MS);
    expect(await tooltip.evaluate(look)).toEqual({ open: true, title: null });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(SETTLE_MS);
    expect(await tooltip.evaluate(look)).toEqual({ open: false, title: 'Bold' });
  });

  it('shows on a long press on a touch screen, without pressing the button; a tap still presses it', async () => {
    const context = await state.browser?.newContext({ hasTouch: true, isMobile: true, viewport: PHONE });
    if (context === undefined) {
      throw new Error('The browser did not start');
    }
    const page = await context.newPage();
    await page.goto(new URL('components/tooltip', state.base).href);
    await page.waitForTimeout(SETTLE_MS);
    const cdp = await context.newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchEnd', x = 0, y = 0) =>
      cdp.send('Input.dispatchTouchEvent', { touchPoints: type === 'touchEnd' ? [] : [{ x, y }], type });
    const tooltip = page.locator('jl-tooltip[text="Copy the link to this page"]');
    await tooltip.scrollIntoViewIfNeeded();
    await tooltip.evaluate((element) => {
      const counter = window as unknown as { presses: number };
      counter.presses = 0;
      const button = element.querySelector('jl-button') as unknown as {
        events: { register(name: string, callback: () => void): void };
      };
      button.events.register('press', () => {
        counter.presses += 1;
      });
    });
    const isOpen = () =>
      tooltip.evaluate((element) => element.shadowRoot?.querySelector('.bubble')?.matches(':popover-open'));
    const box = await tooltip.boundingBox();
    const [x, y] = [(box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2];

    await touch('touchStart', x, y);
    await page.waitForTimeout(LONG_PRESS_WAIT_MS);
    await touch('touchEnd');
    expect(await isOpen()).toBe(true);
    expect(await page.evaluate('window.presses')).toBe(0);

    await page.waitForTimeout(TOUCH_LINGER_WAIT_MS);
    await touch('touchStart', x, y);
    await touch('touchEnd');
    await page.waitForTimeout(SETTLE_MS);
    expect(await isOpen()).toBe(false);
    expect(await page.evaluate('window.presses')).toBe(1);
    await context.close();
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
