import { Request } from 'express';
import { PocketShareModel } from '../models';
import {
  SharesDataSourceAuthenticated,
  SharesDataSourceUnauthenticated,
} from '../datasources/shares';
import { dynamoClient } from '../datasources/dynamoClient';

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

export interface IContext {
  PocketShareModel: PocketShareModel;
}

export class ContextManager implements IContext {
  PocketShareModel: PocketShareModel;
  constructor(options: { request: Request }) {
    const userId = options.request.headers.userid;
    const client = dynamoClient();
    // We have an authenticated user?
    if (
      userId &&
      typeof userId === 'string' &&
      userId.length &&
      userId !== 'anonymous'
    ) {
      const dataSource = new SharesDataSourceAuthenticated(client);
      this.PocketShareModel = new PocketShareModel(dataSource);
    } else {
      const dataSource = new SharesDataSourceUnauthenticated(client);
      this.PocketShareModel = new PocketShareModel(dataSource);
    }
  }
}
