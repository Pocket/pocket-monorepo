import { PrismaClient } from 'generated-prisma/client/index.js';
import { client, conn } from '../database/client.js';
import { Kysely } from 'kysely';
import { DB } from 'generated-kysely/client/types.js';
import { BaseContext } from '../shared/types.js';

/**
 * Context components specifically for the public graph.
 */

export interface IPublicContext extends BaseContext {
  db: PrismaClient;
  conn: Kysely<DB>;
  // Pocket userId coming in from the http headers
  userId: number | bigint;
}

export class PublicContextManager implements IPublicContext {
  constructor(
    private config: {
      db: PrismaClient;
      conn: Kysely<DB>;
      request: any;
    },
  ) {}
  get conn(): IPublicContext['conn'] {
    return this.config.conn;
  }

  get db(): IPublicContext['db'] {
    return this.config.db;
  }

  get userId(): IPublicContext['userId'] {
    const userId = this.config.request.headers.userid;

    return userId instanceof Array ? parseInt(userId[0]) : parseInt(userId);
  }
}

/**
 * Context factory function. Creates a new context upon every request.
 * @param req server request
 *
 * @returns PublicContextManager
 */
export async function getPublicContext({
  req,
}: {
  req: Express.Request;
}): Promise<PublicContextManager> {
  return new PublicContextManager({
    db: client(),
    conn: conn(),
    request: req,
  });
}
