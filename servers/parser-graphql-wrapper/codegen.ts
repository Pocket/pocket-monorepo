import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    './src/__generated__/resolvers-types.ts': {
      config: {
        federation: true,
        useIndexSignature: true,
        contextType: '../context#IContext',
        customResolveInfo:
          '@apollo/cache-control-types#GraphQLResolveInfoWithCacheControl',
        namingConvention: {
          enumValues: 'change-case-all#pascalCase',
          typeNames: 'keep', // need to keep type names cause we have 2 different URL and Url fields
        },
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
