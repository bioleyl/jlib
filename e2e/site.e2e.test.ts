import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Browser, Page } from 'playwright-core';
import type { PreviewServer } from 'vite';
import type { JlAvatar } from '../src/atoms/jl-avatar';
import type { JlBadge } from '../src/atoms/jl-badge';
import type { JlButton } from '../src/atoms/jl-button';
import type { JlCheckbox } from '../src/atoms/jl-checkbox';
import type { JlChip } from '../src/atoms/jl-chip';
import type { JlIcon } from '../src/atoms/jl-icon';
import type { JlInput } from '../src/atoms/jl-input';
import type { JlLink } from '../src/atoms/jl-link';
import type { JlLoadingBar } from '../src/atoms/jl-loading-bar';
import type { JlRating } from '../src/atoms/jl-rating';
import type { JlSelect } from '../src/atoms/jl-select';
import type { JlSkeleton } from '../src/atoms/jl-skeleton';
import type { JlSlider } from '../src/atoms/jl-slider';
import type { JlTextarea } from '../src/atoms/jl-textarea';
import type { JlAlert } from '../src/molecules/jl-alert';
import type { JlAvatarGroup } from '../src/molecules/jl-avatar-group';
import type { JlBreadcrumb } from '../src/molecules/jl-breadcrumb';
import type { JlCalendar } from '../src/molecules/jl-calendar';
import type { JlChipGroup } from '../src/molecules/jl-chip-group';
import type { JlCodeBlock } from '../src/molecules/jl-code-block';
import type { JlCombobox } from '../src/molecules/jl-combobox';
import type { JlDatePicker } from '../src/molecules/jl-date-picker';
import type { JlField } from '../src/molecules/jl-field';
import type { JlFileDrop } from '../src/molecules/jl-file-drop';
import type { JlInputList } from '../src/molecules/jl-input-list';
import type { JlListItem } from '../src/molecules/jl-list-item';
import type { JlLoadState } from '../src/molecules/jl-load-state';
import type { JlMenu } from '../src/molecules/jl-menu';
import type { JlNumberInput } from '../src/molecules/jl-number-input';
import type { JlPagination } from '../src/molecules/jl-pagination';
import type { JlSegmented } from '../src/molecules/jl-segmented';
import type { JlSteps } from '../src/molecules/jl-steps';
import type { JlTabs } from '../src/molecules/jl-tabs';
import type { JlTagInput } from '../src/molecules/jl-tag-input';
import type { JlTimeline } from '../src/molecules/jl-timeline';
import type { JlToast } from '../src/molecules/jl-toast';
import type { JlTooltip } from '../src/molecules/jl-tooltip';
import type { JlCommandPalette } from '../src/organisms/jl-command-palette';
import type { JlDialog } from '../src/organisms/jl-dialog';
import type { JlFlow } from '../src/organisms/jl-flow';
import type { JlPageOutlet } from '../src/organisms/jl-page-outlet';
import type { JlSideNav } from '../src/organisms/jl-side-nav';
import type { JlTable } from '../src/organisms/jl-table';
import type { JlToaster } from '../src/organisms/jl-toaster';
import type { JlTree } from '../src/organisms/jl-tree';

const ROOT = join(import.meta.dirname, '..');
const DOCS = join(ROOT, 'site', 'src', 'docs', 'components');
const GUIDES = [
  '/',
  '/getting-started',
  '/tree-shaking',
  '/theming',
  '/forms',
  '/vibe-coding',
  '/components',
  '/changelog',
];
// The versions CHANGELOG.md lists, as its `## ` headings name them: `Unreleased`, `0.9.0`…
const CHANGELOG_VERSIONS = [...readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8').matchAll(/^## (\S+)/gm)].map(
  (match) => match[1]
);
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
// How far a finger moves to scroll.
const SCROLL_PX = 80;
// Long enough for a page's components to connect and draw (onConnect runs a task after connection).
const SETTLE_MS = 300;
const ICON_WARNING = 'jl-icon:';
// A node's height and the gap below it: the flow's layout puts nodes on rows this far apart.
const FLOW_ROW = 136;
// A point of the window no dialog covers: its backdrop.
const BACKDROP_CORNER = 5;
// More Escapes in a row than a browser lets a page refuse by cancelling the dialog's cancel event.
const ESCAPE_PRESSES = 4;
const ESCAPE_GAP_MS = 150;
// Longer than a tooltip waits before it shows for the focus.
const TOOLTIP_SHOWN_MS = 900;
// Longer than the copy button says what a press came to.
const COPY_SAYS_MS = 1800;

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

/**
 * Every native field of the page, through every shadow root, with neither an id nor a name: Chrome's Issues panel
 * reports each one it shows ("A form field element has neither an id nor a name attribute").
 */
const UNNAMED_FIELDS = `(() => {
  const unnamed = [];
  const visit = (root, host) => {
    for (const element of root.querySelectorAll('*')) {
      if (element.matches('input, select, textarea') && !element.id && !element.name) {
        unnamed.push(host + ' ' + element.localName);
      }
      if (element.shadowRoot) visit(element.shadowRoot, element.localName);
      if (element.localName === 'template') visit(element.content, host);
    }
  };
  visit(document, 'document');
  return unnamed;
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
    '%s renders without errors, with every tag defined and every field named',
    async (path) => {
      const page = await open(path);
      expect(state.errors).toEqual([]);
      expect(await page.evaluate(UNDEFINED_TAGS)).toEqual([]);
      expect(await page.evaluate(UNNAMED_FIELDS)).toEqual([]);
    }
  );
});

/** Puts a component alone in the page shown, in the state a test needs: its page defines its tag. */
async function mount(page: Page, html: string): Promise<void> {
  await page.evaluate((markup) => {
    document.querySelector('#test-area')?.remove();
    const area = document.createElement('div');
    area.id = 'test-area';
    area.innerHTML = markup;
    document.body.prepend(area);
  }, html);
  await page.waitForTimeout(SETTLE_MS);
}

describe('the forms page', () => {
  it('submits the fields as FormData, like native ones', async () => {
    const page = await open('/forms');
    const data = await page.evaluate(`(async () => {
      const root = document.querySelector('site-shell > jl-page-outlet > *').shadowRoot;
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

describe('Enter in a field', () => {
  it('submits its form once, as from a native field, with what was typed', async () => {
    const page = await open('/forms');
    await page.evaluate(`(() => {
      const root = document.querySelector('site-shell > jl-page-outlet > *').shadowRoot;
      window.submits = 0;
      root.querySelector('form').addEventListener('submit', () => { window.submits += 1; });
      root.querySelector('jl-checkbox[name="terms"]').checked.set(true);
    })()`);
    await page.locator('jl-input[name="email"] input').fill('ada@example.com');
    await page.locator('jl-input[name="name"] input').press('Enter');
    expect(await page.evaluate('window.submits')).toBe(1);
    const output = await page.evaluate(`document.querySelector('site-shell > jl-page-outlet > *').shadowRoot
      .querySelector('jl-code-block.output').code.get()`);
    expect(output).toContain('ada@example.com');
    expect(state.errors).toEqual([]);
  });
});

// Rows with an absolutely positioned part, as jl-kbd's spoken text is: it must stay in the area that scrolls it.
const ABSOLUTE_ROWS = `Array.from({ length: 60 }, (_, index) =>
  '<div>Row ' + index + ' <span style="position: absolute">spoken</span></div>').join('')`;

describe('the scrolling areas', () => {
  it.each([
    ['/components/dialog', 'jl-dialog'],
    ['/components/drawer', 'jl-drawer'],
  ])('%s scrolls its body alone, absolutely positioned content included (#3)', async (path, tag) => {
    const page = await open(path);
    const outerScroll = await page.evaluate(`(async () => {
      const element = document.createElement('${tag}');
      element.setAttribute('heading', 'Keys');
      element.innerHTML = ${ABSOLUTE_ROWS};
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, ${SETTLE_MS}));
      element.show();
      await new Promise((resolve) => setTimeout(resolve, ${SETTLE_MS}));
      const panel = element.shadowRoot.querySelector('dialog');
      const scrolled = panel.scrollHeight - panel.clientHeight;
      element.close();
      element.remove();
      return scrolled;
    })()`);
    expect(outerScroll).toBe(0);
  });

  it.each([
    ['/components/split-view', 'jl-split-view'],
    ['/components/table', 'jl-table'],
  ])('%s keeps absolutely positioned content in its own scrolling (#3)', async (path, tag) => {
    const page = await open(path);
    const outerScroll = await page.evaluate(`(async () => {
      const box = document.createElement('div');
      box.style.cssText = 'position: relative; overflow: auto; height: 400px';
      const element = document.createElement('${tag}');
      box.append(element);
      document.body.append(box);
      if ('${tag}' === 'jl-table') {
        element.setAttribute('max-height', '200px');
        await new Promise((resolve) => setTimeout(resolve, ${SETTLE_MS}));
        element.columns.set([{ key: 'name', label: 'Name' }]);
        element.renderers.set({ name: (row) => {
          const cell = document.createElement('div');
          cell.innerHTML = row.name + ' <span style="position: absolute">spoken</span>';
          return cell;
        } });
        element.rows.set(Array.from({ length: 60 }, (_, id) => ({ id, name: 'Row ' + id })));
      } else {
        element.style.height = '300px';
        element.innerHTML = '<div slot="start">' + ${ABSOLUTE_ROWS} + '</div><div slot="end">' + ${ABSOLUTE_ROWS} + '</div>';
      }
      await new Promise((resolve) => setTimeout(resolve, ${SETTLE_MS}));
      const scrolled = box.scrollHeight - box.clientHeight;
      box.remove();
      return scrolled;
    })()`);
    expect(outerScroll).toBe(0);
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

describe('the page', () => {
  it('leaves what is fixed inside it fixed to the window', async () => {
    const page = await open('/components/page');
    const bottom = await page.evaluate(() => {
      const shell = document.createElement('jl-page');
      const bar = document.createElement('div');
      bar.style.cssText = 'position: fixed; bottom: 0; left: 0; height: 40px; width: 100px';
      shell.append(bar);
      document.body.append(shell);
      const rect = bar.getBoundingClientRect();
      shell.remove();
      return Math.round(rect.bottom);
    });
    expect(bottom).toBe(await page.evaluate(() => window.innerHeight));
  });
});

describe('the load state', () => {
  it('draws only the latest of overlapping loads, and does not stick on an error that came late', async () => {
    const page = await open('/components/load-state');
    const result = await page.evaluate(async () => {
      const state = document.createElement('jl-load-state') as JlLoadState;
      document.body.append(state);
      const drawn: string[] = [];
      const answerIn = (milliseconds: number, value: string, fails: boolean) => () =>
        new Promise<string>((resolve, reject) =>
          setTimeout(() => (fails ? reject(new Error('No answer')) : resolve(value)), milliseconds)
        );
      const draw = (value: string) => drawn.push(value);
      const slow = state.load({ draw, fetch: answerIn(300, 'old', true) });
      const fast = state.load({ draw, fetch: answerIn(50, 'new', false) });
      await Promise.all([slow, fast]);
      const outcome = { drawn, state: state.getAttribute('state') };
      state.remove();
      return outcome;
    });
    expect(result).toEqual({ drawn: ['new'], state: 'ready' });
  });

  it('tells when its data came, which whenSettled waits for under a root', async () => {
    const page = await open('/components/load-state');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const holder = document.createElement('div');
      const loadState = document.createElement('jl-load-state') as JlLoadState;
      holder.append(loadState);
      document.body.append(holder);
      const states: string[] = [];
      loadState.events.register('state', (value) => states.push(value));
      const LoadState = customElements.get('jl-load-state') as typeof JlLoadState;
      const settled = LoadState.whenSettled(holder).then(() => [...states]);
      await loadState.load({ draw: () => undefined, fetch: () => wait(100) });
      const whenSettled = await settled;
      holder.remove();
      return { states, whenSettled };
    });
    expect(result).toEqual({ states: ['ready'], whenSettled: ['ready'] });
  });
});

describe('the loading bar', () => {
  it('shows nothing for a quick wait, and a longer one until it ends', async () => {
    const page = await open('/components/loading-bar');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const bar = document.createElement('jl-loading-bar') as JlLoadingBar;
      document.body.append(bar);
      await wait(50);
      const shown = () => bar.shadowRoot?.querySelector<HTMLElement>('.track')?.hidden === false;
      bar.active.set(true);
      await wait(60);
      bar.active.set(false);
      await wait(200);
      const quick = shown();
      bar.active.set(true);
      await wait(300);
      const during = shown();
      bar.active.set(false);
      await wait(700);
      const after = shown();
      bar.remove();
      return { after, during, quick };
    });
    expect(result).toEqual({ after: false, during: true, quick: false });
  });
});

describe('the page outlet', () => {
  it('keeps the page shown until the next one has its data, and drops a page another overtook', async () => {
    const page = await open('/components/page-outlet');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const outlet = document.createElement('jl-page-outlet') as JlPageOutlet;
      document.body.append(outlet);
      const pageLoadingFor = (id: string, milliseconds: number) => {
        const section = document.createElement('section');
        section.id = id;
        const loadState = document.createElement('jl-load-state') as JlLoadState;
        section.append(loadState);
        void loadState.load({ draw: () => undefined, fetch: () => wait(milliseconds) });
        return section;
      };
      const look = () => ({
        busy: outlet.getAttribute('aria-busy'),
        children: outlet.children.length,
        shown: [...outlet.children].filter((child) => child.slot === '').map((child) => child.id),
      });
      outlet.show(pageLoadingFor('first', 0));
      await wait(50);
      const first = look();
      outlet.show(pageLoadingFor('slow', 400));
      await wait(100);
      outlet.show(pageLoadingFor('next', 300));
      await wait(100);
      const meanwhile = look();
      await wait(500);
      const after = look();
      outlet.remove();
      return { after, first, meanwhile };
    });
    expect(result).toEqual({
      after: { busy: null, children: 1, shown: ['next'] },
      first: { busy: null, children: 1, shown: ['first'] },
      meanwhile: { busy: 'true', children: 2, shown: ['first'] },
    });
  });

  it('shows the next page as it is once max-wait has passed', async () => {
    const page = await open('/components/page-outlet');
    const shown = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const outlet = document.createElement('jl-page-outlet') as JlPageOutlet;
      outlet.setAttribute('max-wait', '200');
      document.body.append(outlet);
      const first = document.createElement('section');
      first.id = 'first';
      outlet.show(first);
      const stuck = document.createElement('section');
      stuck.id = 'stuck';
      stuck.append(document.createElement('jl-load-state')); // never loaded: loading for ever
      outlet.show(stuck);
      await wait(400);
      const ids = [...outlet.children].map((child) => `${child.id}${child.slot ? `:${child.slot}` : ''}`);
      outlet.remove();
      return ids;
    });
    expect(shown).toEqual(['stuck']);
  });
});

describe('the badge', () => {
  it('keeps the state showStatus gave it when it moves in the page', async () => {
    const page = await open('/components/badge');
    const label = await page.evaluate(async () => {
      const badge = document.createElement('jl-badge') as JlBadge;
      badge.setAttribute('label', 'Pending');
      document.body.append(badge);
      await new Promise((resolve) => setTimeout(resolve, 50));
      badge.showStatus({ label: 'Shipped', tone: 'ok' });
      const holder = document.createElement('div');
      document.body.append(holder);
      holder.append(badge);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const shown = badge.shadowRoot?.querySelector('.label')?.textContent;
      holder.remove();
      return shown;
    });
    expect(label).toBe('Shipped');
  });
});

describe('the select', () => {
  it('draws its options again only when they change, not for another value or placeholder', async () => {
    const page = await open('/components/select');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const select = document.createElement('jl-select') as JlSelect;
      document.body.append(select);
      await wait(50);
      const native = select.shadowRoot?.querySelector('select');
      if (!native) {
        throw new Error('The select drew no native select');
      }
      // What Chrome's customizable select checks: a node added that no longer has a parent when it looks.
      const detached: string[] = [];
      new MutationObserver((records) => {
        for (const node of records.flatMap((record) => [...record.addedNodes])) {
          if (node.parentNode === null) {
            detached.push(node.nodeName);
          }
        }
      }).observe(native, { childList: true, subtree: true });
      const values = () => [...native.options].map((option) => option.value);
      select.options.set([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);
      select.value.set('b');
      const [first] = native.options;
      // Each change after in a task of its own, as a person makes them.
      await wait(0);
      select.value.set('gone');
      const kept = values();
      await wait(0);
      select.value.set('a');
      const known = values();
      await wait(0);
      select.placeholder.set('Pick');
      select.placeholder.set('Choose one');
      const placeholder = native.options[0]?.text;
      select.value.set('');
      await wait(50);
      const outcome = {
        detached,
        kept,
        known,
        placeholder,
        sameOption: native.options[1] === first,
        shown: native.value,
      };
      select.remove();
      return outcome;
    });
    expect(result).toEqual({
      detached: [],
      kept: ['gone', 'a', 'b'],
      known: ['a', 'b'],
      placeholder: 'Choose one',
      sameOption: true,
      shown: '',
    });
  });
});

describe('the tree', () => {
  it('adds a page after the rows it has, without drawing them again, and gives the focus once to the first it brought', async () => {
    const page = await open('/components/tree');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const tree = document.createElement('jl-tree') as JlTree;
      document.body.append(tree);
      // Five folders, two to a page: the third page is the last.
      const roots = ['r0', 'r1', 'r2', 'r3', 'r4'];
      tree.loader = (_parent, offset) =>
        Promise.resolve({
          items: roots.slice(offset, offset + 2).map((id) => ({ id, label: id, lazy: true })),
          total: roots.length,
        });
      await wait(50);
      const root = tree.shadowRoot;
      if (!root) {
        throw new Error('The tree has no shadow root');
      }
      const row = (id: string) => root.querySelector<HTMLElement>(`[data-id="${id}"]`);
      const ids = (selector: string) =>
        [...root.querySelectorAll<HTMLElement>(selector)].map((element) => element.dataset.id);
      const first = row('r0');
      // Rows of items taken out of the tree: none, when a page only adds its own.
      const removed: string[] = [];
      new MutationObserver((records) => {
        for (const node of records.flatMap((record) => [...record.removedNodes])) {
          if (node instanceof HTMLElement && node.dataset.id && !node.classList.contains('level-end')) {
            removed.push(node.dataset.id);
          }
        }
      }).observe(root, { childList: true, subtree: true });
      // Each focus() lays the page out: counted while a page is pressed for and comes.
      const focus = HTMLElement.prototype.focus;
      const counted = { focusCalls: 0 };
      HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
        counted.focusCalls += 1;
        focus.call(this, options);
      };
      const pressMore = async () => {
        const more = row('jl-tree-level-end:');
        more?.focus();
        counted.focusCalls = 0;
        more?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
        await wait(50);
        return { focusCalls: counted.focusCalls, focused: root.activeElement?.getAttribute('data-id') };
      };
      // An item selected before its page comes is shown selected once it does.
      tree.value.set('r3');
      const second = await pressMore();
      const last = await pressMore();
      HTMLElement.prototype.focus = focus;
      const outcome = {
        last,
        removed,
        roots: ids('.tree > [role="treeitem"]'),
        sameFirst: row('r0') === first,
        second,
        selected: row('r3')?.getAttribute('aria-selected'),
        tabStops: ids('[role="treeitem"][tabindex="0"]'),
      };
      tree.remove();
      return outcome;
    });
    expect(result).toEqual({
      // Once to the spinner that took the pressed row's place, once to the first item the page brought.
      last: { focusCalls: 2, focused: 'r4' },
      removed: [],
      roots: ['r0', 'r1', 'r2', 'r3', 'r4'],
      sameFirst: true,
      second: { focusCalls: 2, focused: 'r2' },
      selected: 'true',
      tabStops: ['r4'],
    });
  });

  it('draws only the level it loads, and the icon of the folder that opens or closes only', async () => {
    const page = await open('/components/tree');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const tree = document.createElement('jl-tree') as JlTree;
      document.body.append(tree);
      const children: Record<string, string[]> = { r0: ['r0a', 'r0b', 'r0c'], r1: ['r1a'] };
      const failed = new Set<string>();
      // Three folders and their children, two to a page. r1 fails once; then it says it has three children but
      // gives one, and its empty second page ends it.
      tree.loader = (parent, offset) => {
        if (parent === 'r1' && !failed.has(parent)) {
          failed.add(parent);
          return Promise.reject(new Error('Offline'));
        }
        const ids = parent === null ? ['r0', 'r1', 'r2'] : (children[parent] ?? []);
        const items = ids.slice(offset, offset + 2).map((id) => ({ id, label: id, lazy: parent === null }));
        return Promise.resolve({ items, total: parent === 'r1' ? 3 : ids.length });
      };
      await wait(50);
      const root = tree.shadowRoot;
      if (!root) {
        throw new Error('The tree has no shadow root');
      }
      const row = (id: string) => root.querySelector<HTMLElement>(`[data-id="${id}"]`);
      const levelEnd = (parent: string) => row(`jl-tree-level-end:${parent}`);
      const ids = (selector: string) =>
        [...root.querySelectorAll<HTMLElement>(selector)].map((element) => element.dataset.id);
      // Rows taken out of the tree: no item's, and only the ends of the levels loaded.
      const removed = { endRows: new Set<string>(), items: [] as string[] };
      new MutationObserver((records) => {
        for (const node of records.flatMap((record) => [...record.removedNodes])) {
          if (!(node instanceof HTMLElement) || !node.dataset.id) {
            continue;
          }
          if (node.classList.contains('level-end')) {
            removed.endRows.add(node.dataset.id);
            continue;
          }
          removed.items.push(node.dataset.id);
        }
      }).observe(root, { childList: true, subtree: true });
      tree.toggle('r0', true);
      await wait(50);
      levelEnd('r0')?.click();
      await wait(50);
      tree.toggle('r1', true);
      await wait(50);
      const errorShown = levelEnd('r1')?.querySelector('.retry') !== null;
      // The error's row loads the page again, then the next, which comes empty.
      levelEnd('r1')?.click();
      await wait(50);
      levelEnd('r1')?.click();
      await wait(50);
      // The icons drawn again as r0 closes: each icon draws its SVG in its own shadow root.
      const iconsDrawn = new Set<Element>();
      for (const icon of root.querySelectorAll('jl-icon')) {
        if (icon.shadowRoot) {
          new MutationObserver(() => iconsDrawn.add(icon)).observe(icon.shadowRoot, {
            childList: true,
            subtree: true,
          });
        }
      }
      // The CSS indents each row by its depth: a child one step (16px) further than its folder.
      const padding = (id: string) => {
        const shownRow = row(id)?.querySelector(':scope > .row');
        return shownRow ? Number.parseFloat(getComputedStyle(shownRow).paddingLeft) : Number.NaN;
      };
      const indent = {
        child: padding('r0a') - padding('r0'),
        levelEnd: padding('jl-tree-level-end:') - padding('r0'),
      };
      tree.toggle('r0', false);
      await wait(50);
      const outcome = {
        endRowsRedrawn: [...removed.endRows].sort(),
        errorShown,
        iconsDrawn: [...iconsDrawn].map((icon) => icon.closest<HTMLElement>('[role="treeitem"]')?.dataset.id),
        indent,
        r0: ids('[data-id="r0"] > .group > [role="treeitem"]'),
        r1: ids('[data-id="r1"] > .group > [role="treeitem"]'),
        removedItems: removed.items,
        roots: ids('.tree > [role="treeitem"]'),
      };
      tree.remove();
      return outcome;
    });
    expect(result).toEqual({
      endRowsRedrawn: ['jl-tree-level-end:r0', 'jl-tree-level-end:r1'],
      errorShown: true,
      iconsDrawn: ['r0'],
      indent: { child: 16, levelEnd: 0 },
      r0: ['r0a', 'r0b', 'r0c'],
      r1: ['r1a'],
      removedItems: [],
      roots: ['r0', 'r1', 'jl-tree-level-end:'],
    });
  });
});

describe('the input list', () => {
  it('draws its rows once as it appears, changes them in place, and builds them again for new values or controls', async () => {
    const page = await open('/components/input-list');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const list = document.createElement('jl-input-list') as JlInputList;
      const root = list.shadowRoot;
      if (!root) {
        throw new Error('The input list has no shadow root');
      }
      // Each time the rows are built: their container gets new children.
      const counted = { builds: 0 };
      new MutationObserver((records) => {
        counted.builds += records.filter(
          (record) =>
            record.target instanceof Element && record.target.matches('.rows') && record.addedNodes.length > 0
        ).length;
      }).observe(root, { childList: true, subtree: true });
      list.values.set(['Ada', 'Grace']);
      list.label.set('Names');
      list.placeholder.set('A name');
      document.body.append(list);
      await wait(50);
      // Each row's control: an input, then a text area once multiline.
      const controls = () => [...root.querySelectorAll<JlInput | JlTextarea>('.row > :first-child')];
      // Whether each row's remove button shows: the CSS hides it for the only row and in a disabled list.
      const removable = () =>
        [...root.querySelectorAll<HTMLElement>('.remove')].map((remove) => remove.checkVisibility());
      const addable = () => root.querySelector<HTMLElement>('.add')?.checkVisibility();
      const shown = controls();
      const asItAppears = { addable: addable(), builds: counted.builds, removable: removable() };
      list.label.set('People');
      list.placeholder.set('Someone');
      list.removeLabel.set('Take out');
      list.disabled.set(true);
      await wait(50);
      const changed = {
        addable: addable(),
        builds: counted.builds,
        disabled: controls().map((control) => control.disabled.get()),
        labels: controls().map((control) => control.label.get()),
        removable: removable(),
        sameControls: controls().every((control, index) => control === shown[index]),
      };
      list.multiline.set(true);
      await wait(50);
      const multiline = { builds: counted.builds, tags: controls().map((control) => control.localName) };
      // New values build the rows again; enabled, the only row still keeps its remove button hidden.
      list.values.set(['Hedy']);
      list.disabled.set(false);
      await wait(50);
      const outcome = {
        asItAppears,
        changed,
        multiline,
        newValues: { builds: counted.builds, removable: removable(), rows: controls().length },
      };
      list.remove();
      return outcome;
    });
    expect(result).toEqual({
      asItAppears: { addable: true, builds: 1, removable: [true, true] },
      changed: {
        addable: false,
        builds: 1,
        disabled: [true, true],
        labels: ['People', 'People'],
        removable: [false, false],
        sameControls: true,
      },
      multiline: { builds: 2, tags: ['jl-textarea', 'jl-textarea'] },
      newValues: { builds: 3, removable: [false], rows: 1 },
    });
  });
});

describe('the text area', () => {
  it('sizes each area to its text up to max-rows by CSS, reading no height', async () => {
    const page = await open('/components/textarea');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      // Each read of a text area's height after a change of the page lays the page out again: they are counted.
      const scrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight');
      const counted = { reads: 0 };
      Object.defineProperty(Element.prototype, 'scrollHeight', {
        configurable: true,
        get(this: Element) {
          if (this instanceof HTMLTextAreaElement) {
            counted.reads += 1;
          }
          return scrollHeight?.get?.call(this);
        },
      });
      const text = (count: number) => Array.from({ length: count }, (_, line) => `Line ${line + 1}`).join('\n');
      // Areas of 1, 4 and 8 lines, then one of 8 lines that grows to 3 at most.
      const sizes = [
        { lines: 1, maxRows: 0 },
        { lines: 4, maxRows: 0 },
        { lines: 8, maxRows: 0 },
        { lines: 8, maxRows: 3 },
      ];
      const areas = sizes.map(({ lines, maxRows }) => {
        const area = document.createElement('jl-textarea') as JlTextarea;
        area.rows.set(1);
        area.maxRows.set(maxRows);
        area.autosize.set(true);
        area.value.set(text(lines));
        return area;
      });
      document.body.append(...areas);
      await wait(100);
      const heights = () =>
        areas.map((area) => area.shadowRoot?.querySelector('textarea')?.getBoundingClientRect().height ?? 0);
      const fitted = heights();
      const [first] = areas;
      first?.value.set(text(6));
      await wait(100);
      const grown = heights();
      const reads = counted.reads;
      if (scrollHeight) {
        Object.defineProperty(Element.prototype, 'scrollHeight', scrollHeight);
      }
      const cappedArea = areas[3]?.shadowRoot?.querySelector('textarea');
      // Read while the areas are in the page: a removed one has no layout.
      const cappedScrolls =
        cappedArea !== undefined && cappedArea !== null && cappedArea.scrollHeight > cappedArea.clientHeight;
      const [one = 0, four = 0, eight = 0, capped = 0] = fitted;
      for (const area of areas) {
        area.remove();
      }
      return {
        cappedScrolls,
        cappedShorter: one < capped && capped < four,
        firstGrew: (grown[0] ?? 0) > one,
        increasing: one < four && four < eight,
        reads,
      };
    });
    // The browser sizes them (field-sizing): no height is read, as they appear or as they grow. Each of their
    // callbacks used to read it, three times each: 18 reads per area.
    expect(result).toEqual({
      cappedScrolls: true,
      cappedShorter: true,
      firstGrew: true,
      increasing: true,
      reads: 0,
    });
  });
});

describe('the icon', () => {
  it('draws its SVG once per name: the same name again, or another size, draws nothing', async () => {
    const page = await open('/components/icon');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const icon = document.createElement('jl-icon') as JlIcon;
      const root = icon.shadowRoot;
      if (!root) {
        throw new Error('The icon has no shadow root');
      }
      // Each SVG put in the icon: one drawing.
      const counted = { draws: 0 };
      new MutationObserver((records) => {
        counted.draws += records.filter((record) =>
          [...record.addedNodes].some((node) => node instanceof SVGElement)
        ).length;
      }).observe(root, { childList: true, subtree: true });
      icon.name.set('heart');
      icon.size.set(16);
      document.body.append(icon);
      await wait(50);
      const asItAppears = counted.draws;
      icon.name.set('heart');
      icon.size.set(32);
      await wait(50);
      const resized = { draws: counted.draws, width: root.querySelector('svg')?.getBoundingClientRect().width };
      icon.name.set('bell');
      await wait(50);
      const outcome = { asItAppears, renamed: counted.draws, resized };
      icon.remove();
      return outcome;
    });
    expect(result).toEqual({ asItAppears: 1, renamed: 2, resized: { draws: 1, width: 32 } });
  });
});

describe('the field', () => {
  it("names its control once, and makes its error once, then only changes the error's text", async () => {
    const page = await open('/components/field');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const field = document.createElement('jl-field') as JlField;
      const input = document.createElement('jl-input') as JlInput;
      field.label.set('Title');
      field.hint.set('As on the cover');
      field.append(input);
      // Each time the field gives the control its label: set() redraws the control even with the label it has.
      const counted = { namings: 0 };
      const setLabel = input.label.set.bind(input.label);
      Object.defineProperty(input.label, 'set', {
        value: (label: string) => {
          counted.namings += 1;
          setLabel(label);
        },
      });
      document.body.append(field);
      await wait(50);
      const nativeInput = input.shadowRoot?.querySelector('input');
      const root = field.shadowRoot;
      const shown = (selector: string) => root?.querySelector<HTMLElement>(selector)?.checkVisibility() ?? false;
      const named = { label: nativeInput?.getAttribute('aria-label'), namings: counted.namings };
      field.error.set('Required');
      await wait(0);
      const error = root?.querySelector('.error');
      const withError = { error: shown('.error'), hint: shown('.hint'), invalid: input.invalid.get() };
      field.error.set('Too short');
      await wait(0);
      const changed = { sameError: root?.querySelector('.error') === error, text: error?.textContent };
      field.error.set('');
      await wait(0);
      const cleared = { error: shown('.error'), hint: shown('.hint'), invalid: input.invalid.get() };
      field.label.set('');
      await wait(0);
      const unlabelled = shown('.label-row');
      field.remove();
      return { changed, cleared, named, unlabelled, withError };
    });
    expect(result).toEqual({
      changed: { sameError: true, text: 'Too short' },
      cleared: { error: false, hint: true, invalid: false },
      // Named once as the field appears, however many of its callbacks and slot changes run.
      named: { label: 'Title', namings: 1 },
      unlabelled: false,
      withError: { error: true, hint: false, invalid: true },
    });
  });
});

describe('icon sizes', () => {
  it('a component sizes its icons by its own size in CSS, setting nothing on them', async () => {
    const page = await open('/components/button');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const button = document.createElement('jl-button') as JlButton;
      button.icon.set('plus');
      button.label.set('Add');
      document.body.append(button);
      await wait(50);
      const icon = button.shadowRoot?.querySelector<JlIcon>('jl-icon.start');
      const width = () => icon?.shadowRoot?.querySelector('svg')?.getBoundingClientRect().width;
      const sizes: Record<string, number | undefined> = {};
      for (const size of ['sm', 'md', 'lg'] as const) {
        button.size.set(size);
        await wait(0);
        sizes[size] = width();
      }
      const outcome = { ownSize: icon?.size.get(), sizes };
      button.remove();
      return outcome;
    });
    // Its own `size` stays the default: the button's CSS gives --icon-size.
    expect(result).toEqual({ ownSize: 16, sizes: { lg: 18, md: 16, sm: 14 } });
  });
});

describe('the date picker, closed', () => {
  it('makes its calendar only when it opens, with its language, bounds and value', async () => {
    const page = await open('/components/date-picker');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const picker = document.createElement('jl-date-picker') as JlDatePicker;
      picker.locale.set('fr-CH');
      picker.min.set('2026-01-01');
      picker.value.set('2026-03-14');
      document.body.append(picker);
      await wait(50);
      const calendar = () => picker.shadowRoot?.querySelector<JlCalendar>('jl-calendar') ?? null;
      const closed = calendar() === null;
      picker.shadowRoot?.querySelector<HTMLButtonElement>('.open')?.click();
      await wait(50);
      const made = calendar();
      const opened = { locale: made?.locale.get(), min: made?.min.get(), value: made?.value.get() };
      picker.value.set('2026-04-01');
      await wait(0);
      const followed = made?.value.get();
      picker.remove();
      return { closed, followed, opened };
    });
    expect(result).toEqual({
      closed: true,
      followed: '2026-04-01',
      opened: { locale: 'fr-CH', min: '2026-01-01', value: '2026-03-14' },
    });
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

    // A finger that scrolls from a word opens nothing; a tap on it does.
    const word = page
      .locator('jl-tooltip')
      .filter({ has: page.locator('[tabindex]') })
      .first();
    await word.scrollIntoViewIfNeeded();
    const wordBox = await word.boundingBox();
    const [wx, wy] = [
      (wordBox?.x ?? 0) + (wordBox?.width ?? 0) / 2,
      (wordBox?.y ?? 0) + (wordBox?.height ?? 0) / 2,
    ];
    const wordOpen = () =>
      word.evaluate((element) => element.shadowRoot?.querySelector('.bubble')?.matches(':popover-open'));
    await touch('touchStart', wx, wy);
    await cdp.send('Input.dispatchTouchEvent', { touchPoints: [{ x: wx, y: wy - SCROLL_PX }], type: 'touchMove' });
    await touch('touchEnd');
    await page.waitForTimeout(SETTLE_MS);
    expect(await wordOpen()).toBe(false);

    // A long press on a button whose tooltip has no text stays a press.
    await page.evaluate(() => {
      const tip = document.createElement('jl-tooltip');
      tip.className = 'demo-silent';
      tip.style.cssText = 'position: fixed; top: 120px; left: 40px; z-index: 1000';
      tip.innerHTML = '<jl-button label="Save"></jl-button>';
      document.body.append(tip);
      const counter = window as unknown as { silentPresses: number };
      counter.silentPresses = 0;
      const button = tip.querySelector('jl-button') as unknown as {
        events: { register(name: string, callback: () => void): void };
      };
      button.events.register('press', () => {
        counter.silentPresses += 1;
      });
    });
    await page.waitForTimeout(SETTLE_MS);
    const silentBox = await page.locator('.demo-silent').boundingBox();
    const [sx, sy] = [
      (silentBox?.x ?? 0) + (silentBox?.width ?? 0) / 2,
      (silentBox?.y ?? 0) + (silentBox?.height ?? 0) / 2,
    ];
    await touch('touchStart', sx, sy);
    await page.waitForTimeout(LONG_PRESS_WAIT_MS);
    await touch('touchEnd');
    await page.waitForTimeout(SETTLE_MS);
    expect(await page.evaluate('window.silentPresses')).toBe(1);
    await context.close();
  });

  it('names a link-button from its visible link, whose own title steps aside too', async () => {
    const page = await open('/components/tooltip');
    await page.evaluate(() => {
      const tip = document.createElement('jl-tooltip');
      tip.className = 'demo-link-tip';
      tip.setAttribute('text', 'Open the settings');
      tip.style.cssText = 'position: fixed; top: 120px; left: 400px; z-index: 1000';
      tip.innerHTML = '<jl-button href="#settings" icon="settings" hint="Settings"></jl-button>';
      document.body.append(tip);
    });
    await page.waitForTimeout(SETTLE_MS);
    const tip = page.locator('.demo-link-tip');
    // What the visible link carries; the page runs this function alone, so it holds its own lookup.
    const linkAttribute = (element: Element, name: string) =>
      element.querySelector('jl-button')?.shadowRoot?.querySelector('a')?.getAttribute(name);
    expect(await tip.evaluate(linkAttribute, 'aria-description')).toBe('Open the settings');
    await tip.hover();
    await page.waitForTimeout(SETTLE_MS);
    expect(await tip.evaluate(linkAttribute, 'title')).toBeNull();
  });
});

describe('the changelog page', () => {
  it('shows each version of CHANGELOG.md, its markup drawn', async () => {
    const page = await open('/changelog');
    const shown = await page.evaluate(`(() => {
      const root = document.querySelector('site-shell > jl-page-outlet > *').shadowRoot;
      // Outside code, where a backtick can be written: \`\` \`open:\${string}\` \`\`.
      const prose = root.querySelector('article').cloneNode(true);
      for (const code of prose.querySelectorAll('code')) {
        code.remove();
      }
      return {
        markup: prose.textContent.includes('**') || prose.textContent.includes('\`'),
        strongCode: root.querySelector('.release strong code') !== null,
        versions: [...root.querySelectorAll('.release h2')].map((heading) => heading.textContent),
      };
    })()`);
    expect(shown).toEqual({ markup: false, strongCode: true, versions: CHANGELOG_VERSIONS });
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
    expect(await page.evaluate("document.querySelector('site-shell > jl-page-outlet > *').localName")).toBe(
      'site-component-page'
    );
    expect(await page.evaluate('document.title')).toBe('Button · jlib');
  });

  it('follow a link without reloading the page', async () => {
    const page = await open('/components');
    await page.evaluate('window.stillTheSamePage = true');
    await page.evaluate(`(() => {
      const list = document.querySelector('site-shell > jl-page-outlet > *').shadowRoot;
      list.querySelector('a.tile[href$="/components/badge"]').click();
    })()`);
    await page.waitForTimeout(SETTLE_MS);
    expect(new URL(page.url()).pathname.endsWith('/components/badge')).toBe(true);
    expect(await page.evaluate('window.stillTheSamePage')).toBe(true);
    expect(await page.evaluate('document.title')).toBe('Badge · jlib');
  });

  it('show the not-found page for an address the site does not have', async () => {
    const page = await open('/no-such-page');
    expect(await page.evaluate("document.querySelector('site-shell > jl-page-outlet > *').localName")).toBe(
      'site-not-found-page'
    );
  });
});

describe('atoms, drawn once', () => {
  it('a checkbox draws its tick only once ticked, and hides an empty label', async () => {
    const page = await open('/components/checkbox');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const box = document.createElement('jl-checkbox') as JlCheckbox;
      box.setAttribute('label', 'Terms');
      document.body.append(box);
      await wait(50);
      const root = box.shadowRoot;
      const svgs = () =>
        [...(root?.querySelectorAll('jl-icon') ?? [])].map(
          (icon) => icon.shadowRoot?.querySelector('svg') ?? null
        );
      const shown = (selector: string) => root?.querySelector<HTMLElement>(selector)?.checkVisibility() ?? false;
      const unticked = { drawn: svgs().filter(Boolean).length, label: shown('.label') };
      box.checked.set(true);
      await wait(0);
      const ticked = { check: shown('.check'), drawn: svgs().filter(Boolean).length };
      box.indeterminate.set(true);
      box.label.set('');
      await wait(0);
      const partly = { dash: shown('.dash'), drawn: svgs().filter(Boolean).length, label: shown('.label') };
      box.remove();
      return { partly, ticked, unticked };
    });
    expect(result).toEqual({
      partly: { dash: true, drawn: 2, label: false },
      ticked: { check: true, drawn: 1 },
      unticked: { drawn: 0, label: true },
    });
  });

  it('a link draws its new-tab icon only when it is external', async () => {
    const page = await open('/components/link');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const link = document.createElement('jl-link') as JlLink;
      link.setAttribute('href', '#');
      link.setAttribute('label', 'Docs');
      document.body.append(link);
      await wait(50);
      const icon = link.shadowRoot?.querySelector('jl-icon');
      const drawn = () => icon?.shadowRoot?.querySelector('svg') !== null;
      const plain = drawn();
      link.external.set(true);
      await wait(0);
      const external = { drawn: drawn(), shown: icon?.checkVisibility() };
      link.remove();
      return { external, plain };
    });
    expect(result).toEqual({ external: { drawn: true, shown: true }, plain: false });
  });

  it('an input checks its validity only for what can change it, and draws its buttons once shown', async () => {
    const page = await open('/components/input');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const input = document.createElement('jl-input') as JlInput;
      for (const [name, value] of [
        ['placeholder', 'Name'],
        ['label', 'Name'],
        ['autocomplete', 'name'],
        ['inputmode', 'text'],
        ['clearable', ''],
        ['required', ''],
      ] as const) {
        input.setAttribute(name, value);
      }
      const counted = { checks: 0 };
      const spied = input as unknown as { mirrorValidity: (native: HTMLInputElement) => void };
      const mirrorValidity = spied.mirrorValidity.bind(input);
      Object.defineProperty(input, 'mirrorValidity', {
        value: (native: HTMLInputElement) => {
          counted.checks += 1;
          mirrorValidity(native);
        },
      });
      document.body.append(input);
      await wait(50);
      const root = input.shadowRoot;
      const svg = (selector: string) =>
        root?.querySelector(`${selector} jl-icon`)?.shadowRoot?.querySelector('svg') ?? null;
      const appeared = { checks: counted.checks, clear: svg('.clear') !== null, reveal: svg('.reveal') !== null };
      input.placeholder.set('Full name');
      input.label.set('Full name');
      const renamed = counted.checks - appeared.checks;
      input.value.set('Ada');
      await wait(0);
      const filled = { clear: svg('.clear') !== null, valid: input.checkValidity() };
      input.type.set('password');
      await wait(0);
      const reveal = root?.querySelector('.reveal');
      const password = { label: reveal?.getAttribute('aria-label'), reveal: svg('.reveal') !== null };
      input.remove();
      return { appeared, filled, password, renamed };
    });
    expect(result).toEqual({
      // value, type, min, max, step, minlength, maxlength, pattern, required, readonly: and required again from HTML.
      appeared: { checks: 11, clear: false, reveal: false },
      filled: { clear: true, valid: true },
      password: { label: 'Show the password', reveal: true },
      renamed: 0,
    });
  });

  it('a select copies its own options once, and shows the chosen one', async () => {
    const page = await open('/components/select');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const select = document.createElement('jl-select') as JlSelect;
      select.setAttribute('placeholder', 'Pick one');
      select.setAttribute('required', '');
      for (const value of ['a', 'b', 'c']) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value.toUpperCase();
        select.append(option);
      }
      const counted = { options: 0 };
      new MutationObserver((records) => {
        for (const record of records) {
          counted.options += [...record.addedNodes].filter((node) => node instanceof HTMLOptionElement).length;
        }
      }).observe(select.shadowRoot as ShadowRoot, { childList: true, subtree: true });
      document.body.append(select);
      await wait(50);
      const native = select.shadowRoot?.querySelector('select');
      const appeared = { options: counted.options, shown: native?.value, valid: select.checkValidity() };
      select.value.set('b');
      await wait(0);
      const chosen = { options: counted.options, shown: native?.value, valid: select.checkValidity() };
      select.remove();
      return { appeared, chosen };
    });
    expect(result).toEqual({
      // The placeholder and the three options, copied once.
      appeared: { options: 4, shown: '', valid: false },
      chosen: { options: 4, shown: 'b', valid: true },
    });
  });

  it('a slider makes its marks once, and places them again for new bounds', async () => {
    const page = await open('/components/slider');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const slider = document.createElement('jl-slider') as JlSlider;
      slider.setAttribute('min', '0');
      slider.setAttribute('max', '10');
      slider.setAttribute('marks', '[0, 5, { "value": 10, "label": "Max" }]');
      slider.style.width = '300px';
      const counted = { marks: 0 };
      new MutationObserver((records) => {
        for (const record of records) {
          counted.marks += [...record.addedNodes].filter(
            (node) => node instanceof HTMLElement && node.classList.contains('mark')
          ).length;
        }
      }).observe(slider.shadowRoot as ShadowRoot, { childList: true, subtree: true });
      document.body.append(slider);
      await wait(50);
      const root = slider.shadowRoot;
      const marks = () => [...(root?.querySelectorAll<HTMLElement>('.mark') ?? [])];
      const left = (mark: HTMLElement | undefined) => Math.round(mark?.getBoundingClientRect().left ?? 0);
      const track = root?.querySelector('.native')?.getBoundingClientRect();
      const start = left(marks()[0]) - Math.round(track?.left ?? 0);
      const appeared = { made: counted.marks, middle: left(marks()[1]) - left(marks()[0]) };
      slider.min.set(5);
      slider.max.set(15);
      await wait(0);
      const moved = {
        made: counted.marks,
        shown: marks().map((mark) => mark.checkVisibility()),
        start: left(marks()[1]) - Math.round(track?.left ?? 0),
      };
      slider.remove();
      return { appeared, moved, start };
    });
    // The thumb is 16px wide: a mark sits where the thumb's centre does, 8px in, and the middle halfway along the rest.
    expect(result).toEqual({
      appeared: { made: 3, middle: 142 },
      moved: { made: 3, shown: [false, true, true], start: 8 },
      start: 8,
    });
  });

  it('a skeleton makes its lines once', async () => {
    const page = await open('/components/skeleton');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const skeleton = document.createElement('jl-skeleton') as JlSkeleton;
      skeleton.setAttribute('shape', 'text');
      skeleton.setAttribute('lines', '3');
      const counted = { bones: 0 };
      new MutationObserver((records) => {
        for (const record of records) {
          counted.bones += [...record.addedNodes].filter(
            (node) => node instanceof HTMLElement && node.classList.contains('bone')
          ).length;
        }
      }).observe(skeleton.shadowRoot as ShadowRoot, { childList: true, subtree: true });
      document.body.append(skeleton);
      await wait(50);
      const appeared = counted.bones;
      skeleton.lines.set(3);
      skeleton.shape.set('rect');
      await wait(0);
      const outcome = {
        appeared,
        rect: counted.bones,
        shown: skeleton.shadowRoot?.querySelectorAll('.bone').length,
      };
      skeleton.remove();
      return outcome;
    });
    expect(result).toEqual({ appeared: 3, rect: 3, shown: 1 });
  });

  it('a rating draws its icons once, sizes them by CSS, and previews a score under the pointer', async () => {
    const page = await open('/components/rating');
    const appeared = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const rating = document.createElement('jl-rating') as JlRating;
      rating.classList.add('drawn-once');
      rating.style.cssText = 'position: fixed; top: 8px; left: 8px; z-index: 10000';
      for (const [name, value] of [
        ['max', '5'],
        ['value', '4'],
        ['icon', 'star'],
        ['size', 'sm'],
      ] as const) {
        rating.setAttribute(name, value);
      }
      const counted = { icons: 0 };
      new MutationObserver((records) => {
        for (const record of records) {
          counted.icons += [...record.addedNodes].filter(
            (node) => node instanceof HTMLElement && node.classList.contains('icon')
          ).length;
        }
      }).observe(rating.shadowRoot as ShadowRoot, { childList: true, subtree: true });
      Object.assign(window, { ratingIcons: counted });
      document.body.append(rating);
      await wait(50);
      const width = () => rating.shadowRoot?.querySelector('svg')?.getBoundingClientRect().width;
      const small = { made: counted.icons, width: width() };
      rating.size.set('lg');
      await wait(0);
      return { large: { made: counted.icons, width: width() }, small };
    });
    const filled = () =>
      page.evaluate(() =>
        [...(document.querySelector('jl-rating.drawn-once')?.shadowRoot?.querySelectorAll('svg') ?? [])].map(
          (svg) => getComputedStyle(svg).fill !== 'rgba(0, 0, 0, 0)'
        )
      );
    // The colours change through a transition: read them once it ended.
    await page.locator('jl-rating.drawn-once .icon[data-value="2"]').hover();
    await page.waitForTimeout(SETTLE_MS);
    const previewed = await filled();
    await page.mouse.move(600, 600);
    await page.waitForTimeout(SETTLE_MS);
    const left = await filled();
    await page.evaluate(() => document.querySelector('jl-rating.drawn-once')?.remove());
    expect({ appeared, left, previewed }).toEqual({
      appeared: { large: { made: 5, width: 26 }, small: { made: 5, width: 16 } },
      left: [true, true, true, true, false],
      previewed: [true, true, false, false, false],
    });
  });

  it('an avatar and a chip draw the icons they show, and none they hide', async () => {
    const page = await open('/components/avatar');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const drawn = (element: Element) =>
        [...(element.shadowRoot?.querySelectorAll('jl-icon') ?? [])].filter(
          (icon) => icon.shadowRoot?.querySelector('svg') !== null
        ).length;
      const named = document.createElement('jl-avatar') as JlAvatar;
      named.setAttribute('name', 'Ada Lovelace');
      const nameless = document.createElement('jl-avatar') as JlAvatar;
      document.body.append(named, nameless);
      await wait(50);
      const avatars = { named: drawn(named), nameless: drawn(nameless) };
      named.remove();
      nameless.remove();
      return avatars;
    });
    const chips = await (await open('/components/chip')).evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const drawn = (element: Element) =>
        [...(element.shadowRoot?.querySelectorAll('jl-icon') ?? [])].filter(
          (icon) => icon.shadowRoot?.querySelector('svg') !== null
        ).length;
      const chip = document.createElement('jl-chip') as JlChip;
      chip.setAttribute('label', 'Draft');
      document.body.append(chip);
      await wait(50);
      const plain = drawn(chip);
      chip.removable.set(true);
      await wait(0);
      const removable = drawn(chip);
      chip.remove();
      return { plain, removable };
    });
    expect({ avatars: result, chips }).toEqual({
      avatars: { named: 0, nameless: 1 },
      chips: { plain: 0, removable: 1 },
    });
  });
});

describe('molecules A, drawn once', () => {
  it('calendar: makes its 42 days once, and choosing a day changes two of them', async () => {
    const page = await open('/components/calendar');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const holder = document.createElement('div');
      // Attributes written in the HTML: each input calls back twice as the calendar connects.
      holder.innerHTML =
        '<jl-calendar value="2026-03-14" min="2026-03-03" max="2026-04-20" first-day="0" locale="fr-CH"></jl-calendar>';
      const calendar = holder.firstElementChild as JlCalendar;
      const root = calendar.shadowRoot;
      if (!root) {
        throw new Error('The calendar has no shadow root');
      }
      // Every day cell ever put in the calendar, and each change of a cell's aria-selected.
      const counted = { cells: new Set<Element>(), flips: 0 };
      new MutationObserver((records) => {
        for (const record of records) {
          counted.flips += record.attributeName === 'aria-selected' ? 1 : 0;
          for (const node of record.addedNodes) {
            const cells = node instanceof Element ? [node, ...node.querySelectorAll('td')] : [];
            for (const cell of cells.filter((element) => element.localName === 'td')) {
              counted.cells.add(cell);
            }
          }
        }
      }).observe(root, { attributeFilter: ['aria-selected'], attributes: true, childList: true, subtree: true });
      const take = async () => {
        await wait(0);
        const taken = { cells: counted.cells.size, flips: counted.flips };
        counted.cells.clear();
        counted.flips = 0;
        return taken;
      };
      const shown = () => ({
        first: root.querySelector('td')?.dataset.date,
        focused: (root.activeElement as HTMLElement | null)?.dataset.date,
        selected: [...root.querySelectorAll<HTMLElement>('[aria-selected="true"]')].map(
          (cell) => cell.dataset.date
        ),
        title: root.querySelector('.title')?.textContent,
      });
      const press = (key: string) =>
        root.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
      document.body.append(holder);
      await wait(50);
      const connected = { ...(await take()), ...shown() };
      root.querySelector<HTMLElement>('[data-date="2026-03-20"]')?.click();
      const chosen = { ...(await take()), ...shown(), value: calendar.value.get() };
      press('ArrowRight');
      const moved = { ...(await take()), ...shown() };
      press('PageDown');
      press('ArrowRight');
      const turned = {
        ...(await take()),
        ...shown(),
        pastMax: root.querySelector('[data-date="2026-04-21"]')?.getAttribute('aria-disabled'),
      };
      holder.remove();
      return { chosen, connected, moved, turned };
    });
    expect(result).toEqual({
      chosen: {
        cells: 0,
        first: '2026-03-01',
        flips: 2,
        focused: '2026-03-20',
        selected: ['2026-03-20'],
        title: 'mars 2026',
        value: '2026-03-20',
      },
      // Made once; the 14th is marked, then moves to another cell when the week starts on Sunday.
      connected: {
        cells: 42,
        first: '2026-03-01',
        flips: 3,
        focused: undefined,
        selected: ['2026-03-14'],
        title: 'mars 2026',
      },
      moved: {
        cells: 0,
        first: '2026-03-01',
        flips: 0,
        focused: '2026-03-21',
        selected: ['2026-03-20'],
        title: 'mars 2026',
      },
      // A page down from the 21st stops at max, the 20th of April, and the arrow cannot pass it.
      turned: {
        cells: 0,
        first: '2026-03-29',
        flips: 1,
        focused: '2026-04-20',
        pastMax: 'true',
        selected: [],
        title: 'avril 2026',
      },
    });
  });

  it('chip group: makes its chips once, resizes their icons in place, and shows the check by CSS', async () => {
    const page = await open('/components/chip-group');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const holder = document.createElement('div');
      holder.innerHTML = `<jl-chip-group size="sm" value="b" label="Letter" options='[{"value":"a","label":"Alpha"},{"value":"b","label":"Beta"},{"value":"c","label":"Gamma","badge":3}]'></jl-chip-group>`;
      const group = holder.firstElementChild as JlChipGroup;
      const root = group.shadowRoot;
      if (!root) {
        throw new Error('The chip group has no shadow root');
      }
      // Every chip ever put in the group.
      const made = new Set<Element>();
      new MutationObserver((records) => {
        for (const node of records.flatMap((record) => [...record.addedNodes])) {
          const chips = node instanceof Element ? [node, ...node.querySelectorAll('.chip')] : [];
          for (const chip of chips.filter((element) => element.matches('.chip'))) {
            made.add(chip);
          }
        }
      }).observe(root, { childList: true, subtree: true });
      const take = async () => {
        await wait(0);
        const count = made.size;
        made.clear();
        return count;
      };
      const chip = (value: string) => root.querySelector<HTMLElement>(`.chip[data-value="${value}"]`);
      const checks = () =>
        ['a', 'b', 'c'].map((value) => chip(value)?.querySelector('.icon')?.checkVisibility() ?? false);
      document.body.append(holder);
      await wait(50);
      const connected = { checks: checks(), chips: await take() };
      group.size.set('lg');
      const resized = {
        chips: await take(),
        width: chip('b')?.querySelector('jl-icon')?.shadowRoot?.querySelector('svg')?.getBoundingClientRect()
          .width,
      };
      chip('a')?.click();
      const chosen = {
        checked: ['a', 'b', 'c'].map((value) => chip(value)?.getAttribute('aria-checked')),
        checks: checks(),
        chips: await take(),
        value: group.value.get(),
      };
      holder.remove();
      return { chosen, connected, resized };
    });
    expect(result).toEqual({
      chosen: { checked: ['true', 'false', 'false'], checks: [true, false, false], chips: 0, value: ['a'] },
      connected: { checks: [false, true, false], chips: 3 },
      resized: { chips: 0, width: 16 },
    });
  });

  it('combobox: keeps one element per option while typing, and an arrow changes two of them', async () => {
    const page = await open('/components/combobox');
    await page.evaluate(() => {
      const holder = document.createElement('div');
      holder.className = 'probe-holder';
      holder.innerHTML = `<jl-combobox class="probe" label="Fruit" options='[{"value":"apple","label":"Apple"},{"value":"apricot","label":"Apricot"},{"value":"banana","label":"Banana"},{"value":"grape","label":"Grape"},{"value":"papaya","label":"Papaya"}]'></jl-combobox>`;
      document.body.append(holder);
      const listbox = holder.querySelector('jl-combobox')?.shadowRoot?.querySelector('.listbox');
      if (!listbox) {
        throw new Error('The combobox has no list');
      }
      // Every option element ever put in the list, and each change of an option's aria-selected.
      const probe = { flips: 0, made: new Set<Node>() };
      Object.assign(window, { probe });
      new MutationObserver((records) => {
        for (const record of records) {
          probe.flips += record.attributeName === 'aria-selected' ? 1 : 0;
          for (const node of record.addedNodes) {
            if (node instanceof Element && node.matches('.option')) {
              probe.made.add(node);
            }
          }
        }
      }).observe(listbox, {
        attributeFilter: ['aria-selected'],
        attributes: true,
        childList: true,
        subtree: true,
      });
    });
    await page.waitForTimeout(50);
    await page.locator('jl-combobox.probe input').click();
    await page.keyboard.type('ap');
    const read = () =>
      page.evaluate(() => {
        const { probe } = window as unknown as { probe: { flips: number; made: Set<Node> } };
        const combobox = document.querySelector<JlCombobox>('jl-combobox.probe');
        const root = combobox?.shadowRoot;
        const native = root?.querySelector('input');
        const active = root?.getElementById(native?.getAttribute('aria-activedescendant') ?? '');
        const outcome = {
          active: active?.querySelector('.option-label')?.textContent,
          flips: probe.flips,
          made: probe.made.size,
          shown: [...(root?.querySelectorAll('.option') ?? [])].map(
            (option) => option.querySelector('.option-label')?.textContent
          ),
          value: combobox?.value.get(),
        };
        probe.flips = 0;
        return outcome;
      });
    const typed = await read();
    await page.keyboard.press('ArrowDown');
    const arrowed = await read();
    await page.keyboard.press('Enter');
    const chosen = await read();
    await page.evaluate(() => document.querySelector('.probe-holder')?.remove());
    const matches = ['Apple', 'Apricot', 'Grape', 'Papaya'];
    expect({ arrowed, chosen, typed }).toEqual({
      arrowed: { active: 'Apricot', flips: 2, made: 5, shown: matches, value: '' },
      chosen: { active: undefined, flips: 1, made: 5, shown: matches, value: 'apricot' },
      typed: { active: 'Apple', flips: 3, made: 5, shown: matches, value: '' },
    });
  });

  it('breadcrumb: makes its crumbs once with its max, and its fold says how many it holds', async () => {
    const page = await open('/components/breadcrumb');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const holder = document.createElement('div');
      holder.innerHTML = `<jl-breadcrumb max="3" items='[{"label":"Home","href":"#"},{"label":"Shop","href":"#"},{"label":"Shoes","href":"#"},{"label":"Boots","href":"#"},{"label":"Chelsea"}]'></jl-breadcrumb>`;
      const breadcrumb = holder.firstElementChild as JlBreadcrumb;
      const root = breadcrumb.shadowRoot;
      if (!root) {
        throw new Error('The breadcrumb has no shadow root');
      }
      // Every crumb ever put in the trail.
      const made = new Set<Element>();
      new MutationObserver((records) => {
        for (const node of records.flatMap((record) => [...record.addedNodes])) {
          const items = node instanceof Element ? [node, ...node.querySelectorAll('li')] : [];
          for (const item of items.filter((element) => element.localName === 'li')) {
            made.add(item);
          }
        }
      }).observe(root, { childList: true, subtree: true });
      const take = async () => {
        await wait(0);
        const count = made.size;
        made.clear();
        return count;
      };
      document.body.append(holder);
      await wait(50);
      const connected = { crumbs: await take(), more: root.querySelector('.more')?.getAttribute('aria-label') };
      root.querySelector<HTMLElement>('.more')?.click();
      const expanded = { crumbs: await take(), focused: root.activeElement?.textContent };
      holder.remove();
      return { connected, expanded };
    });
    expect(result).toEqual({
      connected: { crumbs: 4, more: 'Show 2 more' },
      expanded: { crumbs: 5, focused: 'Shop' },
    });
  });

  it('avatar group: makes its avatars once with its max, and a new size changes them in place', async () => {
    const page = await open('/components/avatar-group');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const holder = document.createElement('div');
      holder.innerHTML = `<jl-avatar-group max="2" size="lg" items='[{"name":"Ada Lovelace"},{"name":"Grace Hopper"},{"name":"Alan Turing"},{"name":"Edsger Dijkstra"}]'></jl-avatar-group>`;
      const group = holder.firstElementChild as JlAvatarGroup;
      const root = group.shadowRoot;
      if (!root) {
        throw new Error('The avatar group has no shadow root');
      }
      // Every avatar ever put in the group.
      const made = new Set<Element>();
      new MutationObserver((records) => {
        for (const node of records.flatMap((record) => [...record.addedNodes])) {
          const avatars = node instanceof Element ? [node, ...node.querySelectorAll('jl-avatar')] : [];
          for (const avatar of avatars.filter((element) => element.localName === 'jl-avatar')) {
            made.add(avatar);
          }
        }
      }).observe(root, { childList: true, subtree: true });
      const take = async () => {
        await wait(0);
        const count = made.size;
        made.clear();
        return count;
      };
      const sizes = () => [...root.querySelectorAll('jl-avatar')].map((avatar) => avatar.getAttribute('size'));
      document.body.append(holder);
      await wait(50);
      const connected = { avatars: await take(), count: root.querySelector('.more')?.textContent, sizes: sizes() };
      group.size.set('sm');
      const resized = { avatars: await take(), sizes: sizes() };
      holder.remove();
      return { connected, resized };
    });
    expect(result).toEqual({
      connected: { avatars: 3, count: '+2', sizes: ['lg', 'lg', 'lg'] },
      resized: { avatars: 0, sizes: ['sm', 'sm', 'sm'] },
    });
  });

  it('code block: colours its code once, and shows line numbers and its header by CSS', async () => {
    const page = await open('/components/code-block');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const holder = document.createElement('div');
      holder.innerHTML =
        '<jl-code-block heading="answer.ts" language="ts" line-numbers code="const answer = 42;"></jl-code-block>';
      const block = holder.firstElementChild as JlCodeBlock;
      const root = block.shadowRoot;
      if (!root) {
        throw new Error('The code block has no shadow root');
      }
      // Each time the code's nodes are replaced: one colouring.
      const counted = { colourings: 0 };
      new MutationObserver((records) => {
        counted.colourings += records.filter((record) => (record.target as Element).localName === 'code').length;
      }).observe(root, { childList: true, subtree: true });
      const take = async () => {
        await wait(0);
        const count = counted.colourings;
        counted.colourings = 0;
        return count;
      };
      const shown = (selector: string) => root.querySelector(selector)?.checkVisibility() ?? false;
      document.body.append(holder);
      await wait(50);
      const connected = {
        colourings: await take(),
        gutter: shown('.gutter'),
        header: shown('header'),
        keyword: root.querySelector('.tok-keyword')?.textContent,
      };
      block.lineNumbers.set(false);
      block.heading.set('');
      const plain = { colourings: await take(), gutter: shown('.gutter'), header: shown('header') };
      holder.remove();
      return { connected, plain };
    });
    expect(result).toEqual({
      connected: { colourings: 1, gutter: true, header: true, keyword: 'const' },
      plain: { colourings: 0, gutter: false, header: false },
    });
  });

  it("alert: draws only the icon it shows, not the tone's first; none draws none", async () => {
    const page = await open('/components/alert');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const holder = document.createElement('div');
      holder.innerHTML =
        '<jl-alert tone="warn" icon="sparkles" heading="Heads up"></jl-alert><jl-alert tone="danger" icon="none"></jl-alert>';
      const [own, none] = [...holder.children] as [JlAlert, JlAlert];
      // Each SVG drawn while the alerts connect: lucide makes each with createElementNS.
      const drawn = { svgs: 0 };
      const make = document.createElementNS;
      Object.defineProperty(document, 'createElementNS', {
        configurable: true,
        value: (namespace: string | null, name: string) => {
          drawn.svgs += name === 'svg' ? 1 : 0;
          return make.call(document, namespace, name);
        },
      });
      document.body.append(holder);
      await wait(50);
      Reflect.deleteProperty(document, 'createElementNS');
      const shown = (alert: JlAlert, selector: string) =>
        alert.shadowRoot?.querySelector(selector)?.checkVisibility() ?? false;
      const outcome = {
        description: shown(own, '.description'),
        heading: shown(own, '.heading'),
        icons: [shown(own, '.icon'), shown(none, '.icon')],
        svgs: drawn.svgs,
      };
      holder.remove();
      return outcome;
    });
    // The sparkles, and the × of each alert's dismiss button.
    expect(result).toEqual({ description: false, heading: true, icons: [true, false], svgs: 3 });
  });
});

describe('molecules B, drawn once', () => {
  it('a list item makes its icon only with an icon and its chevron only as a link; empty texts take no room', async () => {
    const page = await open('/components/list-item');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const item = document.createElement('jl-list-item') as JlListItem;
      item.heading.set('Invoices');
      document.body.append(item);
      await wait(50);
      const root = item.shadowRoot;
      const icons = () => root?.querySelectorAll('jl-icon').length;
      const shown = (selector: string) => root?.querySelector<HTMLElement>(selector)?.checkVisibility() ?? false;
      const plain = { description: shown('.description'), icons: icons(), meta: shown('.meta') };
      item.description.set('Sent monthly');
      item.icon.set('check');
      item.href.set('#');
      await wait(0);
      const linked = { chevron: shown('.chevron'), description: shown('.description'), icons: icons() };
      item.href.set('');
      await wait(0);
      const unlinked = { chevron: shown('.chevron'), icons: icons() };
      item.remove();
      return { linked, plain, unlinked };
    });
    expect(result).toEqual({
      linked: { chevron: true, description: true, icons: 2 },
      plain: { description: false, icons: 0, meta: false },
      unlinked: { chevron: false, icons: 2 },
    });
  });

  it('a tag input makes a chip per tag once, then adds or removes only the one that changed', async () => {
    const page = await open('/components/tag-input');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const counted = { chips: 0, formValues: 0 };
      // Each time the field gives the form its value.
      const setFormValue = ElementInternals.prototype.setFormValue;
      ElementInternals.prototype.setFormValue = function (this: ElementInternals, ...values) {
        counted.formValues += 1;
        setFormValue.apply(this, values);
      };
      const form = document.createElement('form');
      const field = document.createElement('jl-tag-input') as JlTagInput;
      field.name.set('tags');
      field.max.set(5);
      field.value.set(['red', 'green', 'blue']);
      form.append(field);
      const root = field.shadowRoot;
      if (!root) {
        throw new Error('The tag input has no shadow root');
      }
      new MutationObserver((records) => {
        counted.chips += records
          .flatMap((record) => [...record.addedNodes])
          .filter((node) => node instanceof HTMLLIElement).length;
      }).observe(root, { childList: true, subtree: true });
      document.body.append(form);
      await wait(50);
      const connected = { ...counted };
      const green = root.querySelectorAll('.tag')[1];
      field.value.set([...field.value.get(), 'cyan']);
      await wait(0);
      const added = counted.chips - connected.chips;
      root.querySelector<HTMLElement>('.tag-remove')?.click();
      await wait(0);
      const afterRemoval = { kept: root.querySelector('.tag') === green, made: counted.chips - connected.chips };
      const tags = [...root.querySelectorAll('.tag-text')].map((tag) => tag.textContent);
      const submitted = new FormData(form).getAll('tags');
      field.disabled.set(true);
      const removable = root.querySelector<HTMLElement>('.tag-remove')?.checkVisibility();
      ElementInternals.prototype.setFormValue = setFormValue;
      form.remove();
      return { added, afterRemoval, connected, removable, submitted, tags };
    });
    expect(result).toEqual({
      added: 1,
      afterRemoval: { kept: true, made: 1 },
      // Once from its value, once as it connects for its name.
      connected: { chips: 3, formValues: 2 },
      removable: false,
      submitted: ['green', 'blue', 'cyan'],
      tags: ['green', 'blue', 'cyan'],
    });
  });

  it('a segmented control reads no layout while its inputs change, places its thumb at the frame, and resizes in place', async () => {
    const page = await open('/components/segmented');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      // Each read of an offset: one after a change makes the browser lay the page out there and then.
      const counted = { reads: 0, segments: 0 };
      const offsetLeft = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft');
      Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
        configurable: true,
        get(this: HTMLElement) {
          counted.reads += 1;
          return offsetLeft?.get?.call(this);
        },
      });
      const control = document.createElement('jl-segmented') as JlSegmented;
      control.options.set([
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
      ]);
      control.value.set('week');
      document.body.append(control);
      control.size.set('lg');
      control.block.set(true);
      control.value.set('month');
      const whileChanging = counted.reads;
      const root = control.shadowRoot;
      new MutationObserver((records) => {
        counted.segments += records
          .flatMap((record) => [...record.addedNodes])
          .filter((node) => node instanceof HTMLButtonElement).length;
      }).observe(root as ShadowRoot, { childList: true, subtree: true });
      await wait(50);
      control.size.set('sm');
      await frame();
      if (offsetLeft) {
        Object.defineProperty(HTMLElement.prototype, 'offsetLeft', offsetLeft);
      }
      const thumb = root?.querySelector<HTMLElement>('.thumb');
      const chosen = root?.querySelector<HTMLElement>('[aria-checked="true"]');
      const placed = thumb?.style.getPropertyValue('--x') === `${chosen?.offsetLeft}px`;
      const iconless = chosen?.textContent;
      control.remove();
      return { chosen: iconless, placed, segments: counted.segments, whileChanging };
    });
    expect(result).toEqual({ chosen: 'Month', placed: true, segments: 0, whileChanging: 0 });
  });

  it('tabs change only which tab is selected when the value changes, and place the indicator at the frame', async () => {
    const page = await open('/components/tabs');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const counted = { made: 0, reads: 0 };
      const offsetLeft = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft');
      Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
        configurable: true,
        get(this: HTMLElement) {
          counted.reads += 1;
          return offsetLeft?.get?.call(this);
        },
      });
      const tabs = document.createElement('jl-tabs') as JlTabs;
      for (const [name, label] of [
        ['one', 'Overview'],
        ['two', 'Activity'],
        ['three', 'Settings'],
      ] as const) {
        const panel = document.createElement('jl-tab-panel');
        panel.setAttribute('name', name);
        panel.setAttribute('label', label);
        panel.setAttribute('icon', 'check');
        tabs.append(panel);
      }
      document.body.append(tabs);
      tabs.variant.set('pill');
      tabs.value.set('two');
      const whileChanging = counted.reads;
      await wait(50);
      const root = tabs.shadowRoot;
      new MutationObserver((records) => {
        counted.made += records.flatMap((record) => [...record.addedNodes]).length;
      }).observe(root as ShadowRoot, { childList: true, subtree: true });
      tabs.value.set('three');
      await frame();
      if (offsetLeft) {
        Object.defineProperty(HTMLElement.prototype, 'offsetLeft', offsetLeft);
      }
      const indicator = root?.querySelector<HTMLElement>('.indicator');
      const selected = root?.querySelector<HTMLElement>('[aria-selected="true"]');
      const placed = indicator?.style.getPropertyValue('--x') === `${selected?.offsetLeft}px`;
      const shown = [...tabs.children].map((panel) => panel.hasAttribute('selected'));
      tabs.remove();
      return { made: counted.made, placed, selected: selected?.textContent, shown, whileChanging };
    });
    expect(result).toEqual({
      made: 0,
      placed: true,
      selected: 'Settings',
      shown: [false, false, true],
      whileChanging: 0,
    });
  });

  it('a pagination makes its buttons once, then a click changes their numbers in place and focuses the current one', async () => {
    const page = await open('/components/pagination');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const counted = { entries: 0 };
      const pagination = document.createElement('jl-pagination') as JlPagination;
      pagination.pages.set(20);
      pagination.page.set(10);
      const root = pagination.shadowRoot;
      new MutationObserver((records) => {
        counted.entries += records
          .flatMap((record) => [...record.addedNodes])
          .filter((node) => node instanceof HTMLLIElement).length;
      }).observe(root as ShadowRoot, { childList: true, subtree: true });
      document.body.append(pagination);
      await wait(50);
      const atConnection = counted.entries;
      root?.querySelector<HTMLElement>('[data-page="11"]')?.click();
      await wait(0);
      const current = root?.querySelector<HTMLElement>('[aria-current]');
      const outcome = {
        atConnection,
        current: current?.textContent,
        focused: root?.activeElement === current,
        madeOnClick: counted.entries - atConnection,
        numbers: [...(root?.querySelectorAll('.pages li') ?? [])].map((entry) => entry.textContent),
      };
      pagination.remove();
      return outcome;
    });
    expect(result).toEqual({
      atConnection: 7,
      current: '11',
      focused: true,
      madeOnClick: 0,
      numbers: ['1', '…', '10', '11', '12', '…', '20'],
    });
  });

  it('steps are made once, and a new current step changes them in place', async () => {
    const page = await open('/components/steps');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const counted = { icons: 0, steps: 0 };
      const steps = document.createElement('jl-steps') as JlSteps;
      steps.items.set([{ label: 'Cart' }, { label: 'Address' }, { label: 'Payment' }, { label: 'Done' }]);
      steps.current.set(1);
      steps.clickable.set(true);
      const root = steps.shadowRoot;
      new MutationObserver((records) => {
        const added = records.flatMap((record) => [...record.addedNodes]);
        counted.steps += added.filter((node) => node instanceof HTMLLIElement).length;
        counted.icons += added.filter((node) => node instanceof Element && node.localName === 'jl-icon').length;
      }).observe(root as ShadowRoot, { childList: true, subtree: true });
      document.body.append(steps);
      await wait(50);
      const atConnection = { ...counted };
      steps.current.set(2);
      await wait(0);
      const moved = { icons: counted.icons - atConnection.icons, steps: counted.steps - atConnection.steps };
      root?.querySelector<HTMLElement>('button.head')?.click();
      await wait(0);
      const back = {
        current: steps.current.get(),
        focused: root?.activeElement === root?.querySelector('[aria-current] .head'),
        statuses: [...(root?.querySelectorAll<HTMLElement>('.step') ?? [])].map((step) => step.dataset.status),
      };
      steps.remove();
      return { atConnection, back, moved };
    });
    expect(result).toEqual({
      atConnection: { icons: 1, steps: 4 },
      back: { current: 0, focused: true, statuses: ['current', 'upcoming', 'upcoming', 'upcoming'] },
      moved: { icons: 1, steps: 0 },
    });
  });

  it('a timeline is made once, and compact only resizes its icons', async () => {
    const page = await open('/components/timeline');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const counted = { events: 0 };
      const timeline = document.createElement('jl-timeline') as JlTimeline;
      timeline.items.set([
        { icon: 'check', time: '14:32', title: 'Deployed' },
        { time: '14:27', title: 'Checks passed' },
      ]);
      const root = timeline.shadowRoot;
      new MutationObserver((records) => {
        counted.events += records
          .flatMap((record) => [...record.addedNodes])
          .filter((node) => node instanceof HTMLLIElement).length;
      }).observe(root as ShadowRoot, { childList: true, subtree: true });
      document.body.append(timeline);
      await wait(50);
      const atConnection = counted.events;
      timeline.compact.set(true);
      await wait(0);
      // The CSS sizes the icon when compact (--icon-size): its SVG's drawn width.
      const size = root?.querySelector('jl-icon')?.shadowRoot?.querySelector('svg')?.getBoundingClientRect().width;
      const outcome = { atConnection, onCompact: counted.events - atConnection, size };
      timeline.remove();
      return outcome;
    });
    expect(result).toEqual({ atConnection: 2, onCompact: 0, size: 12 });
  });

  it('a load state makes its skeleton only when it shows, and shows each part from its state', async () => {
    const page = await open('/components/load-state');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const counted = { rows: 0 };
      const state = document.createElement('jl-load-state') as JlLoadState;
      const root = state.shadowRoot;
      new MutationObserver((records) => {
        counted.rows += records
          .flatMap((record) => [...record.addedNodes])
          .filter((node) => node instanceof Element && node.classList.contains('bone-row')).length;
      }).observe(root as ShadowRoot, { childList: true, subtree: true });
      document.body.append(state);
      await wait(50);
      // A quick answer, before the skeleton's delay.
      state.state.set('ready');
      await wait(400);
      const shown = (selector: string) => root?.querySelector<HTMLElement>(selector)?.checkVisibility() ?? false;
      const ready = {
        content: shown('.content'),
        error: shown('.error'),
        loading: shown('.loading'),
        rows: counted.rows,
      };
      state.delay.set(0);
      state.state.set('loading');
      await wait(50);
      const loading = { content: shown('.content'), loading: shown('.loading'), rows: counted.rows };
      state.state.set('error');
      await wait(0);
      const failed = { error: shown('.error'), loading: shown('.loading') };
      state.remove();
      return { failed, loading, ready };
    });
    expect(result).toEqual({
      failed: { error: true, loading: false },
      // The default skeleton: three rows, made once.
      loading: { content: false, loading: true, rows: 3 },
      ready: { content: true, error: false, loading: false, rows: 0 },
    });
  });

  it('a menu makes its items as it opens, keeps them for the next opening, and moves the focus to the first', async () => {
    const page = await open('/components/menu');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const menu = document.createElement('jl-menu') as JlMenu;
      const trigger = document.createElement('button');
      trigger.slot = 'trigger';
      trigger.textContent = 'Actions';
      menu.append(trigger);
      menu.items.set([
        { label: 'Edit', value: 'edit' },
        { label: 'Delete', value: 'delete' },
      ]);
      document.body.append(menu);
      await wait(50);
      const root = menu.shadowRoot;
      const items = () => [...(root?.querySelectorAll('[role="menuitem"]') ?? [])];
      const closed = items().length;
      trigger.focus();
      trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, key: 'ArrowDown' }));
      await wait(0);
      const first = items()[0];
      const opened = { focused: root?.activeElement === first, items: items().length };
      menu.hide();
      menu.show();
      await wait(0);
      const kept = items()[0] === first;
      menu.hide();
      menu.remove();
      return { closed, kept, opened };
    });
    expect(result).toEqual({ closed: 0, kept: true, opened: { focused: true, items: 2 } });
  });

  it('a tooltip measures once per scroll, its arrow pointing from the same measures', async () => {
    const page = await open('/components/tooltip');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const tooltip = document.createElement('jl-tooltip') as JlTooltip;
      const trigger = document.createElement('button');
      trigger.textContent = 'Save';
      tooltip.text.set('Save the draft');
      tooltip.append(trigger);
      document.body.prepend(tooltip);
      await wait(50);
      tooltip.show();
      await wait(50);
      const counted = { rects: 0 };
      const getBoundingClientRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function (this: Element) {
        counted.rects += 1;
        return getBoundingClientRect.call(this);
      };
      window.dispatchEvent(new Event('scroll'));
      Element.prototype.getBoundingClientRect = getBoundingClientRect;
      const bubble = tooltip.shadowRoot?.querySelector<HTMLElement>('.bubble');
      const anchor = trigger.getBoundingClientRect();
      const box = bubble?.getBoundingClientRect();
      const arrow = Number.parseFloat(bubble?.style.getPropertyValue('--arrow') ?? '');
      const centre = anchor.left + anchor.width / 2 - (box?.left ?? 0);
      tooltip.hide();
      tooltip.remove();
      return { pointsAtTrigger: Math.abs(arrow - centre) < 1, rects: counted.rects };
    });
    expect(result).toEqual({ pointsAtTrigger: true, rects: 1 });
  });
});

describe('organisms, drawn once', () => {
  it('the table sorts by moving its rows, and checks or opens one row by changing that row alone', async () => {
    const page = await open('/components/table');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const table = document.createElement('jl-table') as JlTable;
      // Forty rows whose dates are in another order than their names.
      const data = Array.from({ length: 40 }, (_, index) => ({
        id: index,
        joined: new Date(Date.UTC(2024, 0, 1 + ((index * 7) % 40))).toISOString().slice(0, 10),
        name: `Item ${index}`,
      }));
      table.columns.set([
        { key: 'name', label: 'Name', sortable: true },
        { format: 'date', key: 'joined', label: 'Joined', sortable: true },
      ]);
      table.rows.set(data);
      table.selectable.set(true);
      table.expandable.set('single');
      table.detail = (row) => document.createTextNode(`More on ${String(row.name)}`);
      document.body.append(table);
      await wait(50);
      const root = table.shadowRoot;
      if (!root) {
        throw new Error('The table has no shadow root');
      }
      const rows = () => [...root.querySelectorAll<HTMLTableRowElement>('tbody > tr[data-index]')];
      const rowNamed = (name: string) => rows().find((row) => row.cells[2]?.textContent === name);
      const before = rows();
      // Each `checked` the table writes: one row ticked writes that row's box and the select-all box.
      const writes = { checked: 0 };
      const checked = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
      Object.defineProperty(HTMLInputElement.prototype, 'checked', {
        configurable: true,
        get(this: HTMLInputElement) {
          return checked?.get?.call(this);
        },
        set(this: HTMLInputElement, value: boolean) {
          writes.checked += 1;
          checked?.set?.call(this, value);
        },
      });
      rowNamed('Item 5')?.querySelector<HTMLInputElement>('.select-cell .checkbox')?.click();
      if (checked) {
        Object.defineProperty(HTMLInputElement.prototype, 'checked', checked);
      }
      // Each aria-expanded the table writes: opening one row writes that row's chevron.
      const expanded = { writes: 0 };
      const chevrons = new MutationObserver((records) => {
        expanded.writes += records.length;
      });
      chevrons.observe(root, { attributeFilter: ['aria-expanded'], subtree: true });
      table.toggle(3, true);
      await wait(0);
      const expandedWrites = expanded.writes;
      chevrons.disconnect();
      root.querySelector<HTMLButtonElement>('button.sort[data-key="joined"]')?.click();
      await wait(0);
      const after = rows();
      const joinedOf = (row: HTMLTableRowElement) =>
        data.find((item) => item.name === row.cells[2]?.textContent)?.joined ?? '';
      const shown = after.map(joinedOf);
      const fifth = rowNamed('Item 5');
      const sixth = rowNamed('Item 6');
      const background = (row: HTMLTableRowElement | undefined) =>
        row?.cells[2] ? getComputedStyle(row.cells[2]).backgroundColor : '';
      const outcome = {
        checkedWrites: writes.checked,
        detailUnderRow: rowNamed('Item 3')?.nextElementSibling?.classList.contains('detail') ?? false,
        expandedWrites,
        kept: {
          checked: fifth?.querySelector<HTMLInputElement>('.select-cell .checkbox')?.checked,
          shaded: background(fifth) !== background(sixth),
        },
        sameRows: after.length === before.length && after.every((row) => before.includes(row)),
        selected: table.selected.get(),
        sort: root.querySelector('th[data-key="joined"]')?.getAttribute('aria-sort'),
        sorted: shown.every((joined, index) => index === 0 || (shown[index - 1] ?? '') <= joined),
      };
      table.remove();
      return outcome;
    });
    expect(result).toEqual({
      checkedWrites: 2,
      detailUnderRow: true,
      expandedWrites: 1,
      kept: { checked: true, shaded: true },
      sameRows: true,
      selected: [5],
      sort: 'ascending',
      sorted: true,
    });
  });

  it('the command palette keeps an option per command while typing, and moves the active one in two writes', async () => {
    const page = await open('/components/command-palette');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const palette = document.createElement('jl-command-palette') as JlCommandPalette;
      palette.hotkey.set('none');
      palette.commands.set(
        Array.from({ length: 30 }, (_, index) => ({
          group: index % 2 === 0 ? 'Even' : 'Odd',
          icon: 'search',
          id: `c${index}`,
          label: `Command ${index}`,
        }))
      );
      document.body.append(palette);
      await wait(50);
      palette.show();
      await wait(50);
      const root = palette.shadowRoot;
      const input = root?.querySelector('input');
      if (!root || !input) {
        throw new Error('The palette drew no search box');
      }
      const options = () => [...root.querySelectorAll<HTMLElement>('[role="option"]')];
      const type = async (text: string) => {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(0);
      };
      const before = options();
      await type('command 1');
      const typed = options();
      const selections = new MutationObserver(() => undefined);
      selections.observe(root, { attributeFilter: ['aria-selected'], subtree: true });
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
      const selectedWrites = selections.takeRecords().length;
      selections.disconnect();
      const active = root.querySelector('[aria-selected="true"]');
      const activeNamed = active !== null && active.id === input.getAttribute('aria-activedescendant');
      const activeIsSecond = active === typed[1];
      await type('zzzz');
      const empty = {
        list: root.querySelector<HTMLElement>('.results')?.checkVisibility(),
        message: root.querySelector<HTMLElement>('.empty')?.checkVisibility(),
      };
      palette.close();
      palette.remove();
      return {
        activeIsSecond,
        activeNamed,
        empty,
        kept: typed.every((option) => before.includes(option)),
        narrowed: typed.length > 0 && typed.length < before.length,
        selectedWrites,
      };
    });
    expect(result).toEqual({
      activeIsSecond: true,
      activeNamed: true,
      empty: { list: false, message: true },
      kept: true,
      narrowed: true,
      selectedWrites: 2,
    });
  });

  it('the side nav draws its items once as it connects, and again only when it turns into its rail', async () => {
    const page = await open('/components/side-nav');
    const result = await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const nav = document.createElement('jl-side-nav') as JlSideNav;
      const root = nav.shadowRoot;
      if (!root) {
        throw new Error('The side nav has no shadow root');
      }
      // Each section put in the nav: two per drawing.
      const counted = { sections: 0 };
      new MutationObserver((records) => {
        counted.sections += records
          .flatMap((record) => [...record.addedNodes])
          .filter((node) => node instanceof HTMLElement && node.classList.contains('section')).length;
      }).observe(root, { childList: true, subtree: true });
      nav.setAttribute(
        'sections',
        JSON.stringify([
          {
            items: [
              { id: 'jobs', label: 'Jobs' },
              { children: [{ id: 'staff', label: 'Staff' }], id: 'people', label: 'People' },
            ],
            label: 'Work',
          },
          { items: [{ id: 'settings', label: 'Settings' }], label: 'Admin' },
        ])
      );
      nav.setAttribute('collapsible', '');
      nav.setAttribute('value', 'staff');
      document.body.append(nav);
      await wait(50);
      const fold = () => root.querySelector<HTMLElement>('.fold')?.checkVisibility();
      const chevron = root.querySelector('[data-id="people"] .chevron');
      const asItAppears = {
        fold: fold(),
        openChevronTurned: chevron !== null && getComputedStyle(chevron).transform !== 'none',
        sections: counted.sections,
      };
      nav.inDrawer.set(true);
      await wait(0);
      const inDrawer = { fold: fold(), sections: counted.sections };
      nav.inDrawer.set(false);
      nav.collapsed.set(true);
      await wait(0);
      const rail = { fold: fold(), rail: nav.hasAttribute('rail'), sections: counted.sections };
      nav.remove();
      return { asItAppears, inDrawer, rail };
    });
    expect(result).toEqual({
      asItAppears: { fold: true, openChevronTurned: true, sections: 2 },
      inDrawer: { fold: false, sections: 2 },
      rail: { fold: true, rail: true, sections: 4 },
    });
  });

  it("the flow moves only a dragged node's edges, and does not draw its nodes again for a move", async () => {
    const page = await open('/components/flow');
    await page.evaluate(async () => {
      const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const flow = document.createElement('jl-flow') as JlFlow;
      flow.id = 'drawn-once';
      Object.assign(flow.style, {
        height: '500px',
        inset: '0',
        position: 'fixed',
        width: '800px',
        zIndex: '1000',
      });
      flow.graph.set({
        edges: [
          { from: 'a', id: 'e1', to: 'b' },
          { from: 'c', id: 'e2', to: 'd' },
        ],
        nodes: [
          { id: 'a', label: 'A', position: { x: 0, y: 0 }, start: true },
          { id: 'b', label: 'B', position: { x: 0, y: 136 } },
          { id: 'c', label: 'C', position: { x: 320, y: 0 }, start: true },
          { id: 'd', label: 'D', position: { x: 320, y: 136 } },
        ],
      });
      document.body.append(flow);
      await wait(200);
    });
    const flow = page.locator('#drawn-once');
    const label = await flow.locator('[data-node="b"] .label').boundingBox();
    if (label === null) {
      throw new Error('The flow drew no node b');
    }
    await page.evaluate(() => {
      const root = document.querySelector('#drawn-once')?.shadowRoot;
      const svg = root?.querySelector('svg.edges');
      if (!root || !svg) {
        throw new Error('The flow drew no edges');
      }
      const probe = {
        labels: [...root.querySelectorAll('.node .label')],
        otherEdge: 0,
        ownEdge: 0,
        svgChildren: 0,
      };
      new MutationObserver((records) => {
        for (const record of records) {
          const edge = (record.target as Element).closest?.('[data-edge]')?.getAttribute('data-edge');
          probe.svgChildren += record.type === 'childList' ? 1 : 0;
          probe.otherEdge += record.attributeName === 'd' && edge === 'e2' ? 1 : 0;
          probe.ownEdge += record.attributeName === 'd' && edge === 'e1' ? 1 : 0;
        }
      }).observe(svg, { attributeFilter: ['d'], attributes: true, childList: true, subtree: true });
      Object.assign(window, { flowProbe: probe });
    });
    await page.mouse.move(label.x + label.width / 2, label.y + label.height / 2);
    await page.mouse.down();
    await page.mouse.move(label.x + label.width / 2 + 40, label.y + label.height / 2 + 80, { steps: 8 });
    const duringDrag = await page.evaluate(() => {
      const { otherEdge, ownEdge, svgChildren } = (
        window as unknown as { flowProbe: { otherEdge: number; ownEdge: number; svgChildren: number } }
      ).flowProbe;
      return { otherEdge, ownEdgeFollows: ownEdge > 0, svgChildren };
    });
    await page.mouse.up();
    const afterDrop = await page.evaluate(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const element = document.querySelector('#drawn-once') as JlFlow;
      const { labels } = (window as unknown as { flowProbe: { labels: Element[] } }).flowProbe;
      const now = [...(element.shadowRoot?.querySelectorAll('.node .label') ?? [])];
      const moved = element.graph.get().nodes.find((node) => node.id === 'b')?.position;
      element.remove();
      return {
        labelsKept: now.length === labels.length && now.every((label, index) => label === labels[index]),
        moved: moved !== undefined && moved.y > 136,
      };
    });
    expect({ afterDrop, duringDrag }).toEqual({
      afterDrop: { labelsKept: true, moved: true },
      duringDrag: { otherEdge: 0, ownEdgeFollows: true, svgChildren: 0 },
    });
    expect(state.errors).toEqual([]);
  });
});

// A bare attribute (aria-invalid="") is one browsers read as false: a state is said with "true", or not at all.
describe('the ARIA states', () => {
  const cases = [
    { attribute: 'aria-invalid', html: '<jl-input label="Name" invalid></jl-input>', path: '/components/input' },
    {
      attribute: 'aria-required',
      html: '<jl-number-input label="Seats" required></jl-number-input>',
      path: '/components/number-input',
    },
    { attribute: 'aria-busy', html: '<jl-button loading>Save</jl-button>', path: '/components/button' },
    {
      attribute: 'aria-disabled',
      html: '<jl-tabs><jl-tab-panel name="a" label="A"></jl-tab-panel><jl-tab-panel name="b" label="B" disabled></jl-tab-panel></jl-tabs>',
      path: '/components/tabs',
    },
  ];

  it.each(cases)('$attribute is "true" where it is set, in $path', async ({ attribute, html, path }) => {
    const page = await open(path);
    await mount(page, html);
    const values = await page
      .locator(`#test-area [${attribute}]`)
      .evaluateAll((elements, name) => elements.map((element) => element.getAttribute(name)), attribute);
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values)).toEqual(new Set(['true']));
    expect(state.errors).toEqual([]);
  });
});

describe('the combobox, left without typing', () => {
  const leave = async (html: string): Promise<{ changes: string[]; value: string }> => {
    const page = await open('/components/combobox');
    await mount(page, html);
    await page.evaluate(() => {
      const combobox = document.querySelector('#test-area jl-combobox') as JlCombobox;
      const heard: string[] = [];
      Object.assign(window, { heard });
      combobox.events.register('change', (value) => heard.push(value));
    });
    await page.locator('#test-area jl-combobox input').focus();
    await page.keyboard.press('Tab');
    return page.evaluate(() => ({
      changes: (window as unknown as { heard: string[] }).heard,
      value: (document.querySelector('#test-area jl-combobox') as JlCombobox).value.get(),
    }));
  };

  it('keeps the second of two options named alike', async () => {
    const options = JSON.stringify([
      { label: 'Jean Dupont', value: 'u1' },
      { label: 'Jean Dupont', value: 'u2' },
    ]);
    expect(await leave(`<jl-combobox label="Owner" value="u2" options='${options}'></jl-combobox>`)).toEqual({
      changes: [],
      value: 'u2',
    });
  });

  it('keeps a value whose options are not there yet', async () => {
    expect(await leave('<jl-combobox label="Owner" value="42"></jl-combobox>')).toEqual({
      changes: [],
      value: '42',
    });
    expect(state.errors).toEqual([]);
  });
});

describe('the number input', () => {
  it('reads a decimal comma', async () => {
    const page = await open('/components/number-input');
    await mount(page, '<jl-number-input label="Price" value="1" step="0.1"></jl-number-input>');
    const field = page.locator('#test-area jl-number-input input');
    await field.fill('1,5');
    await field.press('Tab');
    const value = await page.evaluate(() =>
      (document.querySelector('#test-area jl-number-input') as JlNumberInput).value.get()
    );
    expect(value).toBe(1.5);
    expect(state.errors).toEqual([]);
  });
});

// The element is disabled by the fieldset, not by its own input: nothing inside may act.
describe('a disabled fieldset', () => {
  it('keeps a submit button from pressing and submitting', async () => {
    const page = await open('/components/button');
    await mount(page, '<form><fieldset disabled><jl-button type="submit">Save</jl-button></fieldset></form>');
    await page.evaluate(() => {
      const heard: string[] = [];
      Object.assign(window, { heard });
      document.querySelector('#test-area form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        heard.push('submit');
      });
      (document.querySelector('#test-area jl-button') as JlButton).events.register('press', () =>
        heard.push('press')
      );
    });
    await page.locator('#test-area jl-button').click({ force: true });
    expect(await page.evaluate(() => (window as unknown as { heard: string[] }).heard)).toEqual([]);
    await page.evaluate(() => document.querySelector('#test-area fieldset')?.removeAttribute('disabled'));
    await page.locator('#test-area jl-button').click();
    expect(await page.evaluate(() => (window as unknown as { heard: string[] }).heard)).toEqual([
      'press',
      'submit',
    ]);
    expect(state.errors).toEqual([]);
  });

  it('keeps a combobox from opening and from being cleared', async () => {
    const page = await open('/components/combobox');
    const options = JSON.stringify([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ]);
    await mount(
      page,
      `<fieldset disabled><jl-combobox label="Letter" value="a" clearable options='${options}'></jl-combobox></fieldset>`
    );
    const drawn = await page.evaluate(() => {
      const root = (document.querySelector('#test-area jl-combobox') as JlCombobox).shadowRoot;
      return {
        clearHidden: root?.querySelector<HTMLElement>('.clear')?.hidden,
        toggleDisabled: root?.querySelector<HTMLButtonElement>('.toggle')?.disabled,
      };
    });
    expect(drawn).toEqual({ clearHidden: true, toggleDisabled: true });
  });

  it('keeps a tag input from losing tags and a file drop from browsing', async () => {
    const page = await open('/components/tag-input');
    await mount(
      page,
      `<fieldset disabled><jl-tag-input label="Tags" value='["a","b"]'></jl-tag-input></fieldset>`
    );
    const removeShown = await page.evaluate(() => {
      const remove = (document.querySelector('#test-area jl-tag-input') as JlTagInput).shadowRoot?.querySelector(
        '.tag-remove'
      );
      return remove ? getComputedStyle(remove).display : 'missing';
    });
    expect(removeShown).toBe('none');
    await open('/components/file-drop');
    await mount(page, '<fieldset disabled><jl-file-drop label="Files"></jl-file-drop></fieldset>');
    const browseDisabled = await page.evaluate(
      () =>
        (
          document.querySelector('#test-area jl-file-drop') as JlFileDrop
        ).shadowRoot?.querySelector<HTMLButtonElement>('.browse')?.disabled
    );
    expect(browseDisabled).toBe(true);
    expect(state.errors).toEqual([]);
  });
});

describe('the dialog', () => {
  const isOpen = (page: Page): Promise<boolean> =>
    page.evaluate(() => (document.querySelector('#test-area jl-dialog') as JlDialog).open.get());

  it('stays open when a selection dragged out of a field ends on the backdrop, and closes on a press there', async () => {
    const page = await open('/components/dialog');
    await mount(
      page,
      '<jl-dialog heading="Edit"><input id="typed" value="a text long enough to select" style="width: 300px" /></jl-dialog>'
    );
    await page.evaluate(() => (document.querySelector('#test-area jl-dialog') as JlDialog).show());
    const field = await page.locator('#typed').boundingBox();
    if (field === null) {
      throw new Error('The field is not drawn');
    }
    await page.mouse.move(field.x + 10, field.y + field.height / 2);
    await page.mouse.down();
    await page.mouse.move(BACKDROP_CORNER, BACKDROP_CORNER, { steps: 6 });
    await page.mouse.up();
    expect(await isOpen(page)).toBe(true);
    await page.mouse.click(BACKDROP_CORNER, BACKDROP_CORNER);
    expect(await isOpen(page)).toBe(false);
    expect(state.errors).toEqual([]);
  });

  it('stays open on Escape, however often, while persistent', async () => {
    const page = await open('/components/dialog');
    await mount(page, '<jl-dialog heading="Choose" persistent><p>One of the two.</p></jl-dialog>');
    await page.evaluate(() => (document.querySelector('#test-area jl-dialog') as JlDialog).show());
    for (let press = 0; press < ESCAPE_PRESSES; press += 1) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(ESCAPE_GAP_MS);
    }
    expect(await isOpen(page)).toBe(true);
    expect(state.errors).toEqual([]);
  });
});

// A modal makes what is outside it inert, the top layer included: the toaster sits inside the modal meanwhile.
describe('the toaster over a modal', () => {
  it('lets a toast be closed without closing the dialog, and shows the next one after it closed', async () => {
    const page = await open('/components/toaster');
    await mount(page, '<jl-dialog heading="Edit"><p>A form.</p></jl-dialog><jl-toaster></jl-toaster>');
    await page.evaluate(() => {
      // Kept for later: it moves into the dialog as that one opens, as the page's own toasters do.
      const toaster = document.querySelector('#test-area jl-toaster') as JlToaster;
      Object.assign(window, { toaster });
      (document.querySelector('#test-area jl-dialog') as JlDialog).show();
      toaster.notify({ heading: 'Could not save', tone: 'danger' });
    });
    await page.locator('jl-toast .close').click();
    await page.waitForTimeout(SETTLE_MS);
    const overModal = await page.evaluate(() => {
      const dialog = document.querySelector('#test-area jl-dialog') as JlDialog;
      return { dialogOpen: dialog.open.get(), toasts: dialog.shadowRoot?.querySelectorAll('jl-toast').length };
    });
    expect(overModal).toEqual({ dialogOpen: true, toasts: 0 });
    const afterClose = await page.evaluate(async () => {
      const dialog = document.querySelector('#test-area jl-dialog') as JlDialog;
      const { toaster } = window as unknown as { toaster: JlToaster };
      const movedIn = toaster.parentNode === dialog.shadowRoot?.querySelector('dialog');
      toaster.notify({ heading: 'Saved', tone: 'ok' });
      dialog.close();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        backHome: toaster.parentElement?.id,
        movedIn,
        showing: toaster.shadowRoot?.querySelector('.region')?.matches(':popover-open'),
        toasts: toaster.querySelectorAll('jl-toast').length,
      };
    });
    expect(afterClose).toEqual({ backHome: 'test-area', movedIn: true, showing: true, toasts: 1 });
    expect(state.errors).toEqual([]);
  });
});

// The browser tells a form control that it is disabled before the `disabled` input has read the attribute's change:
// a control that writes the attribute back from there can never be enabled again.
describe('a disabled control', () => {
  const controls = [
    'button',
    'calendar',
    'checkbox',
    'chip-group',
    'combobox',
    'date-picker',
    'file-drop',
    'input',
    'number-input',
    'radio-group',
    'rating',
    'search',
    'segmented',
    'select',
    'slider',
    'switch',
    'tag-input',
    'textarea',
  ];

  it.each(controls)('jl-%s is enabled again once its attribute is removed', async (name) => {
    const page = await open(`/components/${name}`);
    await mount(page, `<jl-${name} label="Field" disabled></jl-${name}>`);
    const enabled = await page.evaluate(async () => {
      const control = document.querySelector('#test-area > *') as HTMLElement;
      control.removeAttribute('disabled');
      await new Promise((resolve) => setTimeout(resolve, 50));
      return !control.hasAttribute('disabled') && !control.matches(':disabled');
    });
    expect(enabled).toBe(true);
    expect(state.errors).toEqual([]);
  });
});

describe('the button', () => {
  it('shows a text given right after it joined the page', async () => {
    const page = await open('/components/button');
    const iconOnly = await page.evaluate(async () => {
      const button = document.createElement('jl-button');
      document.body.prepend(button);
      button.textContent = 'Save changes';
      await new Promise((resolve) => setTimeout(resolve, 50));
      const drawnIconOnly = button.hasAttribute('icon-only');
      button.remove();
      return drawnIconOnly;
    });
    expect(iconOnly).toBe(false);
    expect(state.errors).toEqual([]);
  });
});

describe('the input list, in the page again', () => {
  it('still hears its rows after it was taken out and put back', async () => {
    const page = await open('/components/input-list');
    await mount(page, `<jl-input-list label="Emails" values='["a","b"]'></jl-input-list>`);
    await page.evaluate(async () => {
      const list = document.querySelector('#test-area jl-input-list') as JlInputList;
      const area = list.parentElement;
      list.remove();
      await new Promise((resolve) => setTimeout(resolve, 50));
      area?.append(list);
    });
    await page.waitForTimeout(SETTLE_MS);
    await page.locator('#test-area jl-input-list jl-input input').first().press('End');
    await page.keyboard.type('x');
    const values = await page.evaluate(() =>
      (document.querySelector('#test-area jl-input-list') as JlInputList).values.get()
    );
    expect(values).toEqual(['ax', 'b']);
    expect(state.errors).toEqual([]);
  });

  it('takes numbers written in its values', async () => {
    const page = await open('/components/input-list');
    await mount(page, `<jl-input-list label="Sizes" type="number" values='[1,2]'></jl-input-list>`);
    const values = await page.evaluate(() =>
      (document.querySelector('#test-area jl-input-list') as JlInputList).values.get()
    );
    expect(values).toEqual(['1', '2']);
    expect(state.errors).toEqual([]);
  });
});

describe("the field and its control's label", () => {
  it('keeps a label the control was given in code, and follows its own on a control without one', async () => {
    const page = await open('/components/field');
    const labels = await page.evaluate(async () => {
      const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100));
      const build = (label: string): { field: JlField; input: JlInput } => {
        const field = document.createElement('jl-field') as JlField;
        const input = document.createElement('jl-input') as JlInput;
        field.label.set('Customer');
        // As a JSX prop does: the property, no attribute.
        input.label.set(label);
        field.append(input);
        document.body.prepend(field);
        return { field, input };
      };
      const own = build('Search customers');
      const named = build('');
      await settle();
      const first = [own.input.label.get(), named.input.label.get()];
      own.field.label.set('Client');
      named.field.label.set('Client');
      await settle();
      const second = [own.input.label.get(), named.input.label.get()];
      own.field.remove();
      named.field.remove();
      return { first, second };
    });
    expect(labels).toEqual({ first: ['Search customers', 'Customer'], second: ['Search customers', 'Client'] });
    expect(state.errors).toEqual([]);
  });
});

describe("the table's select-all box", () => {
  it('has nothing to select once the rows are gone', async () => {
    const page = await open('/components/table');
    await mount(page, '<jl-table selectable row-key="id"></jl-table>');
    const afterEmptying = await page.evaluate(async () => {
      const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100));
      const table = document.querySelector('#test-area jl-table') as JlTable;
      const heard: unknown[] = [];
      table.events.register('selection', (keys) => heard.push(keys));
      table.columns.set([{ key: 'name', label: 'Name' }]);
      table.rows.set([
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ]);
      await settle();
      table.rows.set([]);
      await settle();
      const all = table.shadowRoot?.querySelector<HTMLInputElement>('thead input[type="checkbox"]');
      const disabled = all?.disabled;
      all?.click();
      await settle();
      return { disabled, heard };
    });
    expect(afterEmptying).toEqual({ disabled: true, heard: [] });
    expect(state.errors).toEqual([]);
  });
});

describe('the menu, given its items again while open', () => {
  it('stays open, the focus on the item of the same value', async () => {
    const page = await open('/components/menu');
    await mount(page, '<jl-menu label="Actions"><button type="button">Actions</button></jl-menu>');
    const refreshed = await page.evaluate(async () => {
      const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 200));
      const menu = document.querySelector('#test-area jl-menu') as JlMenu;
      const items = [
        { label: 'Rename', value: 'rename' },
        { label: 'Archive', value: 'archive' },
      ];
      menu.items.set(items);
      menu.show();
      await settle();
      menu.shadowRoot?.querySelector<HTMLElement>('[data-value="archive"]')?.focus();
      menu.items.set([{ label: 'Duplicate', value: 'duplicate' }, ...items]);
      await settle();
      const focused = menu.shadowRoot?.activeElement;
      return {
        focused: focused instanceof HTMLElement ? focused.dataset.value : undefined,
        open: menu.shadowRoot?.querySelector('[role="menu"]')?.matches(':popover-open'),
      };
    });
    expect(refreshed).toEqual({ focused: 'archive', open: true });
    expect(state.errors).toEqual([]);
  });
});

describe('a toast shown again', () => {
  it('is visible after it was dismissed', async () => {
    const page = await open('/components/toast');
    await mount(page, '<jl-toast heading="Saved"></jl-toast>');
    const opacity = await page.evaluate(async () => {
      const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 600));
      const toast = document.querySelector('#test-area jl-toast') as JlToast;
      toast.dismiss();
      await settle();
      toast.show();
      await settle();
      const drawn = toast.shadowRoot?.querySelector('.toast');
      return drawn ? getComputedStyle(drawn).opacity : 'missing';
    });
    expect(opacity).toBe('1');
    expect(state.errors).toEqual([]);
  });
});

describe('the copy button, where the clipboard refuses', () => {
  it('says that it could not copy, then is a copy button again', async () => {
    const page = await open('/components/copy-button');
    await mount(page, '<jl-copy-button value="abc"></jl-copy-button>');
    // As on a page served without https: no clipboard at all.
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    );
    await page.locator('#test-area jl-copy-button').click();
    const hint = (): Promise<string | null | undefined> =>
      page.evaluate(() => {
        const button = document.querySelector('#test-area jl-copy-button');
        const drawn = button?.shadowRoot?.querySelector('jl-button')?.shadowRoot?.querySelector('button');
        return button?.hasAttribute('failed') ? drawn?.getAttribute('title') : 'not failed';
      });
    expect(await hint()).toBe('Could not copy');
    await page.waitForTimeout(COPY_SAYS_MS);
    expect(await hint()).toBe('not failed');
    expect(state.errors).toEqual([]);
  });
});

describe("the load state and a page's mistake", () => {
  it('shows the error and lets the exception of draw() through, where a failed fetch only resolves false', async () => {
    const page = await open('/components/load-state');
    await mount(page, '<jl-load-state></jl-load-state>');
    const outcomes = await page.evaluate(async () => {
      const loadState = document.querySelector('#test-area jl-load-state') as JlLoadState;
      const failedFetch = await loadState.load({
        draw: () => undefined,
        fetch: () => Promise.reject(new Error('offline')),
      });
      const mistake = await loadState
        .load({
          draw: (items: string[] | null) => (items as string[]).map(String),
          fetch: () => Promise.resolve(null),
        })
        .then(
          () => 'resolved',
          (error: unknown) => (error instanceof TypeError ? 'TypeError' : 'another error')
        );
      return { failedFetch, mistake, state: loadState.state.get() };
    });
    expect(outcomes).toEqual({ failedFetch: false, mistake: 'TypeError', state: 'error' });
    expect(state.errors).toEqual([]);
  });
});

describe('Escape on a tooltip in a dialog', () => {
  it('puts the tooltip away and leaves the dialog open; the next one closes the dialog', async () => {
    const page = await open('/components/tooltip');
    await mount(
      page,
      '<dialog><jl-tooltip text="Removes the row"><button type="button" id="hinted">Remove</button></jl-tooltip></dialog>'
    );
    await page.evaluate(() => document.querySelector<HTMLDialogElement>('#test-area dialog')?.showModal());
    // The keyboard brings the focus, so the tooltip shows for it.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(TOOLTIP_SHOWN_MS);
    const drawn = (): Promise<{ dialog?: boolean; tooltip?: boolean }> =>
      page.evaluate(() => ({
        dialog: document.querySelector<HTMLDialogElement>('#test-area dialog')?.open,
        tooltip:
          document.querySelector('#test-area jl-tooltip')?.shadowRoot?.querySelector(':popover-open') !== null,
      }));
    expect(await drawn()).toEqual({ dialog: true, tooltip: true });
    await page.keyboard.press('Escape');
    expect(await drawn()).toEqual({ dialog: true, tooltip: false });
    await page.keyboard.press('Escape');
    expect(await drawn()).toEqual({ dialog: false, tooltip: false });
    expect(state.errors).toEqual([]);
  });
});
