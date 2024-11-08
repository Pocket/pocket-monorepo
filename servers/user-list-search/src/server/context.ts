import { Knex } from 'knex';
import type { Request } from 'express';
import {
  PocketContext,
  PocketContextManager,
} from '@pocket-tools/apollo-utils';

export type IContext = PocketContext & {
  knexDbClient: Knex;
  request: Request;
};
export type ContextFactory = (
  req: Request,
  dbClient: Knex,
) => ContextManager | null;

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

export class ContextManager extends PocketContextManager implements IContext {
  public readonly knexDbClient: Knex<any, any[]>;
  constructor(
    public readonly request: Request,
    dbClient: Knex,
  ) {
    super(request.headers);
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
