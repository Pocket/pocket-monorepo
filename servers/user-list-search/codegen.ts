import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    './src/__generated__/types.ts': {
      config: {
        federation: true,
        useIndexSignature: true,
        contextType: '../server/context#IContext',
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
            content: '/* eslint-disable */',
          },
        },
        {
          add: {
            content: '/* tslint:disable */',
          },
        },
        'typescript',
        'typescript-resolvers',
      ],
    },
  },
};

export default config;
