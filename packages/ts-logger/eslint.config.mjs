import packages from '@pocket-tools/eslint-config/packages';
import tseslint from 'typescript-eslint';
export default tseslint.config(...packages, {
  rules: {
    '@typescript-eslint/no-require-imports': ['error', { allow: ['/logger$'] }],
  },
});
