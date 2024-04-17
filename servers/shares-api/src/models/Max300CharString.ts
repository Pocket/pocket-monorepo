import { UserInputError } from '@pocket-tools/apollo-utils';
import { GraphQLScalarType, Kind } from 'graphql';

/**
 * Resolver for the custom 'truncate-after-300 characters' scalar
 * type
 */
export const Max300CharStringResolver = new GraphQLScalarType({
  name: 'Max300CharString',
  description:
    'String truncated to 300 chararacters (truncated strings indicated with ellipses)',
  // Use the default string serialization because we are validating
  // the input, so we don't need to also validate before we return
  parseValue: possiblyTruncated,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new UserInputError(`Expected a string but received ${ast.kind}`);
    }
    return possiblyTruncated(ast.value);
  },
});

/**
 * Validation and sanitization function - check if input
 * is a string and truncates strings longer than 300 characters.
 */
export function possiblyTruncated(value: string) {
  if (typeof value === 'string' && value.length) {
    return value.length > 300 ? value.slice(0, 300) + '...' : value;
  }
  throw new UserInputError('Provided value is not a string');
}
