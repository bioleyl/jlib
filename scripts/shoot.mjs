// Screenshots pages of the documentation site and reports the errors they log. It starts its own Vite server on
// a free port and a headless Chromium, so several can run at once.
//
//   node scripts/shoot.mjs /components/button /components/dialog --out <dir> [--theme dark] [--width 390]
//        [--full] [--eval "<JS run in the page before the shot>"] [--wait 400]
//
// --eval takes an expression; what it returns (awaited) is printed. The page's own elements sit in shadow roots:
// `document.querySelector('site-shell > div > *').shadowRoot` is the current page.
//
// Exits with 1 when a page logged an error.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const ROOT = join(import.meta.dirname, '..');
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 900;
const DEFAULT_WAIT_MS = 400;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    eval: { type: 'string' },
    full: { default: false, type: 'boolean' },
    height: { default: String(DEFAULT_HEIGHT), type: 'string' },
    out: { default: join(ROOT, 'shots'), type: 'string' },
    theme: { default: 'light', type: 'string' },
    wait: { default: String(DEFAULT_WAIT_MS), type: 'string' },
    width: { default: String(DEFAULT_WIDTH), type: 'string' },
  },
});

const paths = positionals.length === 0 ? ['/'] : positionals;
mkdirSync(values.out, { recursive: true });

const server = await createServer({
  configFile: join(ROOT, 'site', 'vite.config.ts'),
  logLevel: 'error',
  server: { port: 0, strictPort: false },
});
await server.listen();
const base = server.resolvedUrls?.local[0];

const browser = await chromium.launch();
const page = await browser.newPage({
  colorScheme: values.theme === 'dark' ? 'dark' : 'light',
  viewport: { height: Number(values.height), width: Number(values.width) },
});
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') {
    errors.push(`${page.url()}: ${message.text()}`);
  }
});
page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));

for (const path of paths) {
  await page.goto(`${base}#${path}`);
  await page.waitForTimeout(Number(values.wait));
  if (values.eval !== undefined) {
    const result = await page.evaluate(values.eval);
    if (result !== undefined) {
      console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    }
    await page.waitForTimeout(Number(values.wait));
  }
  const name = `${path.replace(/^\//, '').replaceAll('/', '-') || 'home'}-${values.theme}-${values.width}.png`;
  const file = join(values.out, name);
  await page.screenshot({ fullPage: values.full, path: file });
  console.log(file);
}

await browser.close();
await server.close();

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):\n${errors.join('\n')}`);
  process.exit(1);
}
