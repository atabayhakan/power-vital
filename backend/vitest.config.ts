import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    isolate: true, // isolate DB state between test files
    sequence: { concurrent: false },
    // Every suite talks to ONE shared MySQL and several reset it with global
    // deleteMany() in beforeEach/beforeAll. Running files in parallel let one
    // file's reset wipe another file's freshly-seeded rows mid-test (e.g.
    // checkout's product.deleteMany() nuking ocr's order product → FK
    // violation). Serialise files so each owns the DB for its duration.
    // (isolate/sequence above only govern behaviour WITHIN a single file.)
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/workers/**', 'src/generated/**']
    }
  }
});
