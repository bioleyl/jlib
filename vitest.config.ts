import { defineConfig } from 'vitest/config';

// Unit tests for the pure helpers in src/lib and site/src/lib, and a few components in a DOM of a file's own
// (`@vitest-environment`): the render budget in happy-dom, jl-table in jsdom as apps' tests meet it. What the
// components do in a real browser is checked by the e2e suite.
export default defineConfig({
  oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
  test: {
    css: true,
    include: ['tests/**/*.test.ts'],
  },
});
