import { resolve } from 'node:path';

import { defineConfig } from 'vite';

const SRC = resolve(import.meta.dirname, '..', 'src');

// The documentation site: a static build with relative paths and hash routes, so it works from any folder.
export default defineConfig({
  base: './',
  // One bundle: the site shows every component and every doc on any page, so splitting would not save a load.
  build: { chunkSizeWarningLimit: 800, emptyOutDir: true, outDir: 'dist', target: 'es2024' },
  oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
  resolve: {
    alias: [
      { find: /^jlib$/, replacement: resolve(SRC, 'index.ts') },
      { find: /^jlib\/(.*)$/, replacement: `${SRC}/$1` },
    ],
  },
  root: import.meta.dirname,
  // The library's sources and the fonts live above the site's root.
  server: { fs: { allow: [resolve(import.meta.dirname, '..')] }, port: 5190 },
});
