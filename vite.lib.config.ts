import { resolve } from 'node:path';

import { defineConfig } from 'vite';

const SRC = resolve(import.meta.dirname, 'src');
// A stylesheet's module, as the build names it: `atoms/jl-button.css?inline`.
const INLINE_SUFFIX = /[?_]inline$/;

// The library: one ES module per source module, so a bundler keeps only the components an app imports.
export default defineConfig({
  build: {
    // The code stays readable for the apps' bundlers, which minify it; the CSS, a string inside it (`?inline`), only
    // this build can minify.
    cssMinify: 'lightningcss',
    emptyOutDir: true,
    lib: {
      entry: { all: resolve(SRC, 'all.ts'), index: resolve(SRC, 'index.ts') },
      formats: ['es'],
    },
    minify: false,
    outDir: 'dist',
    rollupOptions: {
      external: [/^@jadis\/core/, /^lucide/],
      output: {
        // A component's stylesheet becomes a module beside it: atoms/jl-button.css.js.
        entryFileNames: (chunk) => `${chunk.name.replace(INLINE_SUFFIX, '')}.js`,
        preserveModules: true,
        preserveModulesRoot: SRC,
      },
    },
    target: 'es2024',
  },
  oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
});
