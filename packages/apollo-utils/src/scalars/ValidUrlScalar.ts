// Copied from https://github.com/Urigo/graphql-scalars/blob/master/src/scalars/URL.ts
// but renamed from URL to ValidUrl

import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';

export const GraphQLValidUrl = /*#__PURE__*/ new GraphQLScalarType({
  name: 'ValidUrl',

  description:
    'A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.',

  serialize(value) {
    if (value === null) {
      return value;
    }

    return new URL(value.toString()).toString();
  },

  parseValue: (value) => (value === null ? value : new URL(value.toString())),

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as URLs but got a: ${ast.kind}`,
        {
          nodes: ast,
        },
      );
    }

    if (ast.value === null) {
      return ast.value;
    } else {
      return new URL(ast.value.toString());
    }
  },
  extensions: {
    codegenScalarType: 'ValidUrl | string',
    jsonSchema: {
      type: 'string',
      format: 'uri',
    },
  },
});
