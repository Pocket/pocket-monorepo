import { Request } from 'express';

import {
  AuthenticationError,
  PocketContext,
  PocketContextManager,
} from '@pocket-tools/apollo-utils';
import { Kysely } from 'kysely';
import { DB } from '../__generated__/db';
import { db } from '../datasources/db';
import { NoteModel } from '../models/Note';

/**
 * Context factory function. Creates a new context upon
 * every request
 * @param req server request
 * @returns ContextManager
 */
export async function getContext({
  req,
}: {
  req: Request;
}): Promise<ContextManager> {
  return new ContextManager({
    request: req,
  });
}

export interface IContext extends PocketContext {
  db: Kysely<DB>;
  userId: string;
  NoteModel: NoteModel;
}

export class ContextManager extends PocketContextManager implements IContext {
  db: Kysely<DB>;
  _userId: string;
  NoteModel: NoteModel;
  constructor(options: { request: Request }) {
    super(options.request.headers);
    // This should never happen due to constraints on the schema
    // But we will include it for type safety
    if (super.userId == null) {
      throw new AuthenticationError(
        'Must be authenticated to use this service',
      );
    } else {
      this._userId = super.userId;
    }
    this.db = db;
    this.NoteModel = new NoteModel(this);
  }
  /** Override because userId is guaranteed in this Context */
  override get userId(): string {
    return this._userId;
  }
}
