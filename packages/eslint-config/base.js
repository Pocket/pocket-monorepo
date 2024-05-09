// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import packageJson from 'eslint-plugin-package-json/configs/recommended';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // TODO: Enable after the change to eslint9 and fix errors in a followup
  // ...tseslint.configs.recommendedTypeChecked,
  // ...tseslint.configs.stylisticTypeChecked,
  // ...tseslint.configs.strictTypeChecked,
  {
    // Old rules that we used to use, but we will want to slowly turn back on
    rules: {
      // allows unused vars when declared in arguments
      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', args: 'none' },
      ],
      // disables case checks for class/interface/type
      '@typescript-eslint/class-name-casing': 0,
      // disables case checks for properties
      '@typescript-eslint/camelcase': 0,
      // allows 'any' typehint
      '@typescript-eslint/no-explicit-any': 0,
    },
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    ignores: [
      'node_modules/*',
      'dist/*',
      '*.mjs',
      '*.js',
      '**/*.js',
      'codegen.ts',
      'prisma/**/*',
    ],
  },
  {
    ...packageJson,
    rules: {
      ...packageJson.rules,
      'package-json/order-properties': [
        'error',
        {
          order: 'sort-package-json',
        },
      ],
    },
  },
  // Must be last, turns on prettier rules
  // https://github.com/prettier/eslint-plugin-prettier?tab=readme-ov-file#configuration-new-eslintconfigjs
  // also uses eslint-config-prettier to turn off conflicting rules
  eslintPluginPrettierRecommended,
);
