import { Knex } from 'knex';
import { AuthenticationError } from '@pocket-tools/apollo-utils';

export type IContext = {
  userId: string;
  userIsPremium: boolean;
  knexDbClient: Knex;
};
export type ContextFactory = (req, dbClient: Knex) => ContextManager | null;

/**
 * Used to determine if a query is an introspection query so
 * that it can bypass our authentication checks and return the schema.
 * @param query
 * @returns
 */
export const isIntrospection = (query: string): boolean => {
  //Ref: https://github.com/anvilco/apollo-server-plugin-introspection-metadata/blob/main/src/index.js#L25
  const isIntrospectionRegex = /\b(__schema|__type)\b/;
  return typeof query === 'string' && isIntrospectionRegex.test(query);
};

export const isSubgraphIntrospection = (query: string): boolean => {
  //Ref: https://github.com/anvilco/apollo-server-plugin-introspection-metadata/blob/main/src/index.js#L25
  const isSubgraphIntrospectionRegex = /\b(_service)\b/;
  return typeof query === 'string' && isSubgraphIntrospectionRegex.test(query);
};

export class ContextManager implements IContext {
  public readonly userId: string;
  public readonly userIsPremium: boolean;
  public readonly knexDbClient: Knex<any, any[]>;
  constructor(request, dbClient: Knex) {
    const userId = request.headers.userid;
    if (!userId || userId === 'anonymous') {
      throw new AuthenticationError(
        'You must be logged in to use this service',
      );
    }
    this.userId = userId;
    this.userIsPremium = request.headers.premium === 'true';
    this.knexDbClient = dbClient;
  }
}

export const getContextFactory: ContextFactory = (
  req,
  dbClient: Knex,
): ContextManager | null => {
  if (
    isIntrospection(req.body.query) ||
    isSubgraphIntrospection(req.body.query)
  ) {
    // Bypass auth (ie, the userId() function throwing auth errors) for introspection
    return null;
  }
  return new ContextManager(req, dbClient);
};
