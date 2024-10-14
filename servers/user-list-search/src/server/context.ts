import { Knex } from 'knex';
import type { Request } from 'express';

export type IContext = {
  userId: string;
  userIsPremium: boolean;
  knexDbClient: Knex;
  isNative: boolean;
  request: Request;
  ip: string | undefined;
  encodedId: string | undefined;
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

export class ContextManager implements IContext {
  public readonly userId: string;
  public readonly userIsPremium: boolean;
  public readonly knexDbClient: Knex<any, any[]>;
  public readonly isNative: boolean;
  public readonly ip: string | undefined;
  public readonly encodedId: string | undefined;
  constructor(
    public readonly request: Request,
    dbClient: Knex,
  ) {
    this.userId = request.headers.userid as string;
    this.userIsPremium = request.headers.premium === 'true';
    this.knexDbClient = dbClient;
    this.isNative = request.headers.applicationisnative === 'true';
    this.ip =
      (request.headers.gatewayipaddress as string) ||
      (request.headers['origin-client-ip'] as string) ||
      undefined;
    this.encodedId = (request.headers.encodedid as string) || undefined;
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
