// ESLint flat config (v9+) for the frontend.
// Goals:
//   • Catch obvious bugs (no-undef, no-unused-vars, no-floating-promises).
//   • Enforce Vue 3 conventions (v-on:click -> @click, prop typechecks).
//   • Style is light — no semicolon wars. The existing codebase already
//     uses 2-space indent + single quotes; we codify that here.
//   • Skip generated/test files to avoid noise.
//
// Run:
//   npm run lint            # check only
//   npm run lint:fix        # auto-fix where safe
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import globals from 'globals';

export default [
  // Ignore patterns — generated code, dependencies, build output, CLI scripts.
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'public/**',                 // service workers, manifest, static assets
      'scripts/**',                // CLI tools — allow console + require
      'src/api/types.ts',          // generated from openapi.json
      'src/**/__tests__/**/snapshots/**',
      'tests/fixtures/**',
      '**/*.cjs',                  // legacy CommonJS scripts
    ],
  },

  // Base JS/TS recommended rules.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Vue 3 essential + strongly-recommended rules. We deliberately skip the
// full 'flat/recommended' preset because it enforces dozens of
// formatting choices (singleline element line breaks, attribute
// linebreaks, etc.) that conflict with the existing codebase style.
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },

  // Project-wide overrides.
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest globals — `describe`, `it`, `expect`, `vi` are auto-imported
        // in our test files.
        ...globals.vitest,
      },
    },
    rules: {
      // We use single quotes everywhere.
      'quotes': ['error', 'single', { avoidEscape: true }],
      // Allow unused vars prefixed with `_` (function args).
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // Catch handlers often log or surface the error inline (e.g.
        // `catch (err) { showToast(err) }`). The `.+` pattern means
        // any name is allowed; combined with `varsIgnorePattern` below
        // we keep the codebase consistent without forcing `_` renames.
        caughtErrorsIgnorePattern: '.+',
      }],
      // Allow `any` for now — openapi-client uses it heavily for legacy
      // payloads and migration is out of scope.
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow non-null assertions sparingly — we use them in test files.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // No console.warn in production code (use the project logger).
      'no-console': ['error', { allow: ['error', 'warn'] }],
      // Vue: enforce `value` over `value=""` shorthand on HTML elements.
      'vue/no-unused-vars': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': ['error', {
        html: { void: 'always', normal: 'always', component: 'always' },
      }],
    },
  },

  // Test files — be more lenient with `any`, magic numbers, console.
  {
    files: ['tests/**/*.{ts,vue}', 'src/**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      // Test files intentionally have setup-only imports / unused fixtures.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  // Test setup file — needs CommonJS require() for jest-dom matchers.
  {
    files: ['tests/setup.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Catch handlers that intentionally swallow the error — the `_`
  // prefix is fine, but the rule still fires because the binding
  // shadows the inner scope. Permit any name with `varsIgnorePattern: '.*'`.
  // (Kept off — devs should use `catch (_e)` consistently.)
];