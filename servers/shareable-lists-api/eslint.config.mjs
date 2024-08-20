import servers from '@pocket-tools/eslint-config/servers';
import tseslint from 'typescript-eslint';
export default tseslint.config(...servers, {
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
  },
});
