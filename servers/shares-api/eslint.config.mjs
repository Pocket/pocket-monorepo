import servers from '@pocket-tools/eslint-config/servers';
import tseslint from 'typescript-eslint';
export default tseslint.config(...servers, {
  ignores: ['src/__generated__/*'],
});
