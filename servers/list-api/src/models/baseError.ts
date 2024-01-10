import { GraphQLResolveInfo } from 'graphql';

/**
 * Class for handling shared methods in errors
 * that are modeled in the schema (e.g. NotFound or
 * any other error that implements BaseError interface)
 */
export class BaseErrorModel {
  /**
   * Stringify the path data; traverses path ancestors
   * and prepends field names with period
   * @param path The path from the Info object passed to all resolvers
   * @returns a period-separated string of the path to the field
   * (direct ancestors only)
   */
  public path(path: GraphQLResolveInfo['path']): string {
    let pathNode = path;
    // Extract current field node, then every previous node
    let pathString = pathNode.key.toString();
    // This could be done recursively but usually better not to
    // in javascript
    while (pathNode.prev !== undefined) {
      // period-separated path
      pathString = pathNode.prev.key.toString() + '.' + pathString;
      pathNode = pathNode.prev;
    }
    return pathString;
  }
}
