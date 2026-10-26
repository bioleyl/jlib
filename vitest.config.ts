import { defineConfig } from 'vitest/config';

// Unit tests for the pure helpers in src/lib and site/src/lib. The components themselves are checked in a real
// browser by the e2e suite.
export default defineConfig({
  oxc: { jsx: { importSource: '@jadis/core', runtime: 'automatic' } },
  test: {
    css: true,
    include: ['tests/**/*.test.ts'],
  },
});
