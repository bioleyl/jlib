import { defineConfig } from 'vitest/config';

// The site, built for production, in a headless Chromium: npm run test:e2e builds it first.
export default defineConfig({
  test: {
    hookTimeout: 60_000,
    include: ['e2e/**/*.e2e.test.ts'],
    testTimeout: 60_000,
  },
});
