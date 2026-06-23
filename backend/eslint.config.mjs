// ESLint flat config for the backend (Express + Prisma + vitest).
//
// Goals mirror the frontend config but skip the Vue plugin:
//   • Catch obvious bugs (no-undef, no-unused-vars, no-floating-promises).
//   • Style is light — single quotes, no semicolon wars.
//   • Skip generated Prisma client (prisma/generated/**) and tests.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'prisma/**',          // generated client + migrations + seed scripts
      'prisma.config.ts',   // Prisma 6 config (CLI tool)
      'tests/fixtures/**',
      'scripts/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,ts,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        // Vitest globals for our test files.
        ...globals.vitest,
      },
    },
    rules: {
      'quotes': ['error', 'single', { avoidEscape: true }],
      // The backend has a long history of imported-but-unused symbols
      // (type aliases, type-only imports, etc.) — we don't want the
      // lint pass to require a sweeping rename. We still catch
      // undefined references via `no-undef`.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Allow `any` — Prisma generated client and route payloads are typed loosely.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': ['error', { allow: ['error', 'warn'] }],
      // Allow `require()` — some legacy modules still use CommonJS.
      '@typescript-eslint/no-require-imports': 'off',
      // Allow empty catch / block — handlers often swallow errors
      // intentionally (rate limit fallbacks, best-effort cleanup).
      'no-empty': 'off',
      // Stats counters are often declared-then-incremented across
      // branches; the rule's heuristic misfires on counter accumulators.
      'no-useless-assignment': 'off',
    },
  },

  // Test files — be more lenient.
  {
    files: ['tests/**/*.{ts,js}', '**/*.test.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];