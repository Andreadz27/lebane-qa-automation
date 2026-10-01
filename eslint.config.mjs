import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'tmp/', 'playwright/.auth/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Los casos con bug conocido usan test.fail() de forma intencional.
      'playwright/no-conditional-in-test': 'off',
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expect'] }],
    },
  },
);
