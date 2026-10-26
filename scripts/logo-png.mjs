// Renders the SyWare logo SVGs of site/public into large PNGs beside them. Shown small, a large picture shrunk by
// the browser keeps smooth edges, where the vector drawn straight at 32px shows steps on a standard screen.
// Run after changing a logo SVG: node scripts/logo-png.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from 'playwright-core';

const PUBLIC = join(import.meta.dirname, '..', 'site', 'public');
// Eight times the 32px the site shows them at: enough for screens of three device pixels per CSS pixel.
const HEIGHT = 256;
const MARK_INK = '#231f20';
const WHITE = '#ffffff';

const mark = readFileSync(join(PUBLIC, 'syware-mark.svg'), 'utf8');
// The mark for dark grounds, as the logo has one: its ink in white.
writeFileSync(join(PUBLIC, 'syware-mark-dark.svg'), mark.replace(`fill="${MARK_INK}"`, `fill="${WHITE}"`));

const SOURCES = ['syware-logo', 'syware-logo-dark', 'syware-mark', 'syware-mark-dark'];

const browser = await chromium.launch();
for (const name of SOURCES) {
  const svg = readFileSync(join(PUBLIC, `${name}.svg`), 'utf8');
  const [, , boxWidth, boxHeight] =
    svg
      .match(/viewBox="([^"]+)"/)?.[1]
      .split(' ')
      .map(Number) ?? [];
  const width = Math.round((HEIGHT * boxWidth) / boxHeight);
  const page = await browser.newPage({ viewport: { height: HEIGHT, width } });
  const sized = svg.replace('<svg ', `<svg width="${width}" height="${HEIGHT}" `);
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${sized}`);
  await page.screenshot({ omitBackground: true, path: join(PUBLIC, `${name}.png`) });
  await page.close();
  console.log(`${name}.png ${width}×${HEIGHT}`);
}
// How a standard screen draws the mark small, from the SVG and from the PNG: a capture at one device pixel per CSS
// pixel, which the Logo page shows magnified.
const COMPARE_SIZES = [16, 20, 24, 32];
const GAP = 14;
const ROW = 40;
const dataUrl = (file, type) => `data:${type};base64,${readFileSync(join(PUBLIC, file)).toString('base64')}`;
const sources = [dataUrl('syware-mark.svg', 'image/svg+xml'), dataUrl('syware-mark.png', 'image/png')];
const rowOf = (src) =>
  `<div style="display:flex;align-items:flex-end;gap:${GAP}px;height:${ROW}px">${COMPARE_SIZES.map((size) => `<img src="${src}" height="${size}">`).join('')}</div>`;
const compareWidth = COMPARE_SIZES.reduce((sum, size) => sum + Math.ceil(size * 0.92) + GAP, GAP);
const compare = await browser.newPage({
  deviceScaleFactor: 1,
  viewport: { height: ROW * 2 + GAP * 3, width: compareWidth },
});
await compare.setContent(
  `<body style="margin:0;padding:${GAP}px;background:#fff;display:grid;gap:${GAP}px">${sources.map(rowOf).join('')}</body>`
);
await compare.waitForTimeout(300);
await compare.screenshot({ path: join(PUBLIC, 'logo-small-sizes.png') });
console.log('logo-small-sizes.png');

await browser.close();
