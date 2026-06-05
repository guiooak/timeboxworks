import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

/**
 * Architecture boundary: every wrapped external library may only be imported
 * inside its own `common/services/*` (or, for recharts, `common/components/chart`)
 * abstraction. Feature code must depend on our interfaces, never the library.
 *
 * Keyed by the abstraction that "owns" the library.
 */
const WRAPPED = {
  'date-fns': ['date-fns', 'date-fns/*'],
  firebase: ['firebase', 'firebase/*'],
  recharts: ['recharts', 'recharts/*'],
  zustand: ['zustand', 'zustand/*'],
  'react-router': ['react-router', 'react-router-dom'],
};

const message =
  'Import this library only through its common/services/* abstraction, never directly.';

/** Build a no-restricted-imports rule banning every wrapped lib except `exceptKey`. */
function restrictImports(exceptKey) {
  const patterns = Object.entries(WRAPPED)
    .filter(([key]) => key !== exceptKey)
    .flatMap(([, globs]) => globs);
  return ['error', { patterns: [{ group: patterns, message }] }];
}

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.yarn/**',
      'datetime-lib-benchmark/**',
      '**/*.config.{js,ts}',
      'eslint.config.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks, import: importPlugin },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'import/no-default-export': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': restrictImports(null),
    },
  },

  // ── Per-abstraction overrides: re-enable exactly one library in its folder ──
  {
    files: ['src/common/services/datetime/**'],
    rules: { 'no-restricted-imports': restrictImports('date-fns') },
  },
  {
    files: ['src/common/services/auth/**', 'src/common/services/database/**'],
    rules: { 'no-restricted-imports': restrictImports('firebase') },
  },
  {
    files: ['src/common/services/chart/**', 'src/common/components/chart/**'],
    rules: { 'no-restricted-imports': restrictImports('recharts') },
  },
  {
    files: ['src/common/services/state/**'],
    rules: { 'no-restricted-imports': restrictImports('zustand') },
  },
  {
    files: ['src/common/services/router/**'],
    rules: { 'no-restricted-imports': restrictImports('react-router') },
  },

  // Tests may use any helper import freely.
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // Ambient declaration files require interfaces (module augmentation) and
  // default exports (CSS module shims).
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      'import/no-default-export': 'off',
    },
  },

  eslintConfigPrettier,
);
