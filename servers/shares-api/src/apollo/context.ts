import { Request } from 'express';
import { PocketShareModel } from '../models';
import {
  SharesDataSourceAuthenticated,
  SharesDataSourceNonNativeApp,
  SharesDataSourceUnauthenticated,
} from '../datasources/shares';
import { dynamoClient } from '../datasources/dynamoClient';
import { UserContext, UserContextFactory } from '../models/UserContext';
import { config } from '../config';
import { eventBridgeClient, EventBus } from '../events';
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
  User: UserContext;
}

export class ContextManager implements IContext {
  PocketShareModel: PocketShareModel;
  User: UserContext;
  constructor(options: { request: Request }) {
    const rawUserId = options.request.headers.userid;
    const rawGuid = options.request.headers.guid;
    const isNative =
      options.request.headers.applicationisnative === 'true' ? true : false;
    const client = dynamoClient();
    const bus = new EventBus(eventBridgeClient());
    // We have an authenticated user?
    const userId =
      rawUserId &&
      typeof rawUserId === 'string' &&
      rawUserId.length &&
      rawUserId !== 'anonymous'
        ? rawUserId
        : undefined;
    const guid =
      rawGuid && typeof rawGuid === 'string' && rawGuid.length
        ? rawGuid
        : undefined;
    const salts = {
      userSalt: config.dynamoDb.sharesTable.userSalt,
      guidSalt: config.dynamoDb.sharesTable.guidSalt,
    };
    this.User = UserContextFactory(salts, guid, userId);
    // Using native app is required for link creation regardless of login status
    if (!isNative) {
      const dataSource = new SharesDataSourceNonNativeApp(client);
      this.PocketShareModel = new PocketShareModel(dataSource, bus, this.User);
    } else {
      if (userId) {
        const dataSource = new SharesDataSourceAuthenticated(client);
        this.PocketShareModel = new PocketShareModel(
          dataSource,
          bus,
          this.User,
        );
      } else {
        const dataSource = new SharesDataSourceUnauthenticated(client);
        this.PocketShareModel = new PocketShareModel(
          dataSource,
          bus,
          this.User,
        );
      }
    }
  }
}
