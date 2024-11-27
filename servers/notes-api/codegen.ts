import { CodegenConfig } from '@graphql-codegen/cli';
import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    './src/__generated__/graphql.d.ts': {
      config: {
        federation: true,
        useIndexSignature: true,
        contextType: '../apollo/context#IContext',
        scalars: {
          ValidUrl: PocketDefaultScalars.ValidUrl.extensions.codegenScalarType,
          ISOString:
            PocketDefaultScalars.ISOString.extensions.codegenScalarType,
          Markdown: 'string',
          ProseMirrorJson: 'string',
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
