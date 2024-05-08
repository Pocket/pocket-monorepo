import base from '@pocket-tools/eslint-config';
import tseslint from 'typescript-eslint';
export default tseslint.config(...base, { root: true });
