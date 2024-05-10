import { GraphQLResolveInfoWithCacheControl as GraphQLResolveInfo } from '@apollo/cache-control-types';

/**
 * Checks if a query/field name (name of a resolver) is in an ancestor
 * in the chain
 * @param name the resolver name to look for
 * @param info the info object passed to every resolver
 * @param inclusive whether to include the current node as part of
 * the resolver chain check (defaults to true)
 */
export function isInResolverChain(
  name: string,
  path: GraphQLResolveInfo['path'],
  inclusive = true,
): boolean {
  let node = inclusive ? path : path.prev;
  while (node) {
    if (node.key === name) return true;
    node = node.prev;
  }
  return false;
}
