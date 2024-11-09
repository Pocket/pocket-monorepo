import { PrismaClient } from '.prisma/client';
import { client, conn } from '../database/client';
import { Kysely } from 'kysely';
import { DB } from '.kysely/client/types';
import {
  PocketContext,
  PocketContextManager,
} from '@pocket-tools/apollo-utils';

/**
 * Context components specifically for the public graph.
 */

export interface IPublicContext extends PocketContext {
  db: PrismaClient;
  conn: Kysely<DB>;
  // Pocket userId coming in from the http headers
  intUserId: number | bigint;
}

export class PublicContextManager
  extends PocketContextManager
  implements IPublicContext
{
  constructor(
    private config: {
      db: PrismaClient;
      conn: Kysely<DB>;
      request: any;
    },
  ) {
    super(config.request.headers);
  }

  get conn(): IPublicContext['conn'] {
    return this.config.conn;
  }

  get db(): IPublicContext['db'] {
    return this.config.db;
  }

  get intUserId(): IPublicContext['intUserId'] {
    const userId = this.userId;
    return parseInt(userId);
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
