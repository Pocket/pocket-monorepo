import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://client-api.getpocket.com',
  documents: ['src/graphql/**/*.graphql'],
  emitLegacyCommonJSImports: false,
  generates: {
    './src/generated/graphql/types.ts': {
      config: {
        emitLegacyCommonJSImports: false,
      },
      plugins: [
        //generated types do not conform to ts/lint rules, disable them for these files
        {
          add: {
            content: '// THIS FILE IS GENERATED, DO NOT EDIT!',
          },
        },
        {
          add: {
            content: '/* tslint:disable */',
          },
        },
        {
          add: {
            content: '/* eslint-disable */',
          },
        },
        'typescript',
        'typescript-operations',
        'typed-document-node',
      ],
    },
  },
};

export default config;
