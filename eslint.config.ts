import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ── Bỏ qua các thư mục không cần lint ──────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // ── Base: recommended rules cho TypeScript ──────────────────────────
  ...tseslint.configs.strictTypeChecked,

  // ── Config cho test files ──────────────────────────────────────────
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Strict type-checked rules được nới lỏng cho test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },

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

      // Cấm throw new Error() — phải dùng PluginError (xem CONVENTIONS.md)
      'no-restricted-syntax': [
        'error',
        {
          message: 'Dùng PluginError thay vì Error thô (xem CONVENTIONS.md)',
          selector: 'ThrowStatement > NewExpression > Identifier.callee[name="Error"]',
        },
      ],
    },
  }
);
