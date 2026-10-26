import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { defineConfig } from 'vite';

import type { Plugin } from 'vite';

const SITE = import.meta.dirname;
const SRC = resolve(SITE, '..', 'src');
const OUT = resolve(SITE, 'dist');
// Where GitHub Pages serves the site; SITE_BASE overrides it for another host. Development serves from the root.
const PAGES_BASE = process.env.SITE_BASE ?? '/jlib/';
const DEV_BASE = '/';
const ROUTE_PATH = /path: '(\/[^']*)'/g;
const DOC_FILE = /^jl-(.+)\.doc\.ts$/;

/** Every route of the site: the guide and design pages, and a page per documented component. */
function routes(): string[] {
  const listed = ['docs/registry.ts', 'docs/design.ts'].flatMap((file) =>
    [...readFileSync(join(SITE, 'src', file), 'utf8').matchAll(ROUTE_PATH)].map((match) => match[1] ?? '/')
  );
  const components = readdirSync(join(SITE, 'src', 'docs', 'components'))
    .map((file) => DOC_FILE.exec(file)?.[1])
    .filter((slug): slug is string => slug !== undefined)
    .map((slug) => `/components/${slug}`);
  return [...new Set([...listed, ...components])].filter((route) => route !== '/');
}

/**
 * History routes on a static host: a copy of index.html for every route (`components/button.html`, which GitHub
 * Pages serves for `/components/button`), and 404.html for any other address, so the app opens wherever it starts.
 */
function staticRoutes(): Plugin {
  return {
    apply: 'build',
    closeBundle() {
      const index = readFileSync(join(OUT, 'index.html'), 'utf8');
      writeFileSync(join(OUT, '404.html'), index);
      for (const route of routes()) {
        const file = join(OUT, `${route.slice(1)}.html`);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, index);
      }
    },
    name: 'jlib-static-routes',
  };
}

// The documentation site: a static build with history routes under the base it is served from.
export default defineConfig(({ command, isPreview }) => ({
  // The build, and its preview, under the Pages base; the development server at the root.
  base: command === 'build' || isPreview === true ? PAGES_BASE : DEV_BASE,
  // One bundle: the site shows every component and every doc on any page, so splitting would not save a load.
  build: { chunkSizeWarningLimit: 800, emptyOutDir: true, outDir: OUT, target: 'es2024' },
  oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
  plugins: [staticRoutes()],
  resolve: {
    alias: [
      { find: /^jlib$/, replacement: resolve(SRC, 'index.ts') },
      { find: /^jlib\/(.*)$/, replacement: `${SRC}/$1` },
    ],
  },
  root: SITE,
  // The library's sources and the fonts live above the site's root.
  server: { fs: { allow: [resolve(SITE, '..')] }, port: 5190 },
}));
