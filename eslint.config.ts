import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ── Bỏ qua các thư mục không cần lint ──────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // ── Base: recommended rules cho TypeScript ──────────────────────────
  ...tseslint.configs.recommended,

  // ── Config chính ────────────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript type-check
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Code style
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  }
);
