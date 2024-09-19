// Copied from https://github.com/Urigo/graphql-scalars/blob/master/src/scalars/URL.ts
// but renamed from URL to ValidUrl

import { GraphQLScalarType, Kind, GraphQLError, ValueNode } from 'graphql';

export const GraphQLValidUrl = /*#__PURE__*/ new GraphQLScalarType({
  name: 'ValidUrl',

  description:
    'A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.',

  serialize(value) {
    if (value === null || value === undefined) {
      return value;
    }

    return new URL(value.toString()).toString();
  },

  parseValue: (value) =>
    value === null || value === undefined ? value : new URL(value.toString()),

  parseLiteral(ast: ValueNode) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as URLs but got a: ${ast.kind}`,
        {
          nodes: ast,
        },
      );
    }

    if (ast.value === null) {
      return null;
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
