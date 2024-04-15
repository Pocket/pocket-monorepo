import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    './src/__generated__/resolvers-types.ts': {
      config: {
        federation: true,
        useIndexSignature: true,
        contextType: '../apollo/context#IContext',
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
            content: '/* eslint-disable @typescript-eslint/ban-ts-comment */',
          },
        },
        {
          add: {
            content: '/* eslint-disable prettier/prettier */',
          },
        },
        {
          add: {
            content: '/* tslint:disable */',
          },
        },
        {
          add: {
            content: '/* eslint:disable */',
          },
        },
        'typescript',
        'typescript-resolvers',
      ],
    },
  },
};

export default config;
