import { IncomingHttpHeaders } from 'http';
import { Knex } from 'knex';
import { UserEventEmitter } from './events/userEventEmitter';
import {
  BasicUserEventPayloadWithContext,
  EventType,
  UserForEvent,
} from './events/eventType';
import { IntMask } from '@pocket-tools/int-mask';
import { UserDataService } from './dataService/userDataService';
import { UserModel } from './models/User';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';
import config from './config';

export interface IContext {
  userId: string | undefined;
  fxaUserId?: string;
  transferSub?: string;
  headers: IncomingHttpHeaders;
  db: {
    readClient: Knex;
    writeClient: Knex;
  };
  eventEmitter: UserEventEmitter;
  // Why is this models? All we use this for is the user model.
  models: { user: UserModel };

  emitUserEvent(event: EventType, data: UserForEvent): void;
}

/**
 * Entrypoint for generating GraphQL context.
 * The ContextManager should not be constructed directly, but
 * it is difficult to make the constructor static since downstream
 * data services (e.g. UserDataService) require a ContextManager
 * instance to be constructed.
 * To ensure that the context manager is always initialized,
 * make the entire class private and export a factory function
 * instead.
 * @param config The config for ContextManager
 * @returns an initialized ContextManager promise
 */
export const ContextFactory = async (config: {
  request: any;
  db: { readClient: Knex; writeClient: Knex };
  eventEmitter: UserEventEmitter;
}): Promise<ContextManager> => {
  return await new ContextManager(config).initialize();
};

/**
 * Note that the instance MUST be initialized with ContextManager.initialize()
 * in order to add the correct model(s). This is because an asynchronous call
 * to the database might be required to fetch appropriate IDs (e.g. initialiizing
 * UserModel with FxA ID rather than internal Pocket User ID).
 */
class ContextManager implements IContext {
  private _userId: string | undefined = undefined;
  public fxaUserId: string | undefined = undefined;
  public transferSub: string | undefined = undefined;
  public models: { user: UserModel } = { user: undefined };
  constructor(
    private config: {
      request: any;
      db: { readClient: Knex; writeClient: Knex };
      eventEmitter: UserEventEmitter;
    },
  ) {
    if (
      this.headers.transfersub != null &&
      this.headers.transfersub != undefined &&
      this.headers.transfersub != 'undefined'
    ) {
      this.transferSub = this.headers.transfersub;
    } else if (this.headers.fxauserid != null) {
      const fxaUserId = this.headers.fxauserid;
      this.fxaUserId = fxaUserId instanceof Array ? fxaUserId[0] : fxaUserId;
    } //try to capture userId for other cases
    else {
      const userId = this.headers.userid;
      this._userId = userId instanceof Array ? userId[0] : userId;
    }

    // Set tracking data for Sentry
    Sentry.configureScope((scope) => {
      scope.setTag('pocket-api-id', (this.headers.apiid || '0') as string);
      if (this.headers.encodedid) {
        scope.setUser({ id: this.headers.encodedid as string });
      }
    });
  }

  /**
   * Populate userId if context was constructed with the
   * fxaUserId header; otherwise, a noop
   */
  async initialize(): Promise<ContextManager> {
    //if condition for apple migration
    if (this.transferSub != null) {
      serverLogger.info('initialize: with transferSub', {
        transferSub: this.transferSub,
      });
      this._userId = await UserDataService.getPocketIdByTransferSub(
        this,
        this.transferSub,
      );

      if (this._userId == null) {
        serverLogger.error('initialize: no user id for transfersub', {
          transferSub: this.transferSub,
          headers: this.headers,
        });
        throw new Error(
          `unable to find user_id for transfersub: ${this.transferSub}}`,
        );
      }
    }

    if (this._userId == null && this.fxaUserId != null) {
      serverLogger.info('initialize: with fxaUserId', {
        fxaUserId: this.fxaUserId,
      });
      try {
        const userDataService = await UserDataService.fromFxaId(
          this,
          this.fxaUserId,
        );
        this._userId = userDataService.userId;
      } catch (e) {
        serverLogger.error('Could not find user with FxA userId', {
          fxaUserId: this.fxaUserId,
        });
        throw new NotFoundError('FxA user not found');
      }
    }

    // This shouldn't need to be in a if block, but it is possible to have a null userId at this point if the the userid header was empty.
    // Also some service is passing through anonymous to user-api, however this service always should have a user...
    if (this._userId != null && this._userId != 'anonymous') {
      // If we have a user, lets identify them and the error
      // We encode the error because we identifiy users in sentry with encoded user ids across all the clients and services
      Sentry.configureScope((scope) => {
        // This is in a try catch in case the IntMask function values on a weird or invalid value, for now we dont want to halt execution, or throw an error.
        try {
          scope.setUser({
            id: IntMask.encode(this._userId, config.secrets.intMask),
          });
        } catch (e) {
          serverLogger.error('Could not encode user id for sentry', {
            userId: this._userId,
            message: e.message,
            headers: this.headers,
          });
          Sentry.captureMessage('Could not encode user id for sentry');
        }
      });
      this.models.user = new UserModel(this);
    } else {
      // when we get here, we have no userid, which should mean that this user is not logged in
      // and thus don't have access to `user`.
      // Decision-tree-wise we should thrown a ForbiddenError here, but, unfortunately throwing that error
      // in the middleware phase (which is where this is executed) causes the request to 500.
      // So, instread, we check the user model's null-ness in the resolver phase and throw the error there.
      this.models.user = null;
    }
    return this;
  }

  get headers(): { [key: string]: any } {
    return this.config.request.headers;
  }

  get userId(): string | undefined {
    return this._userId;
  }
  get apiId(): string {
    const apiId = this.headers.apiid || '0';
    return apiId instanceof Array ? apiId[0] : apiId;
  }

  get db(): IContext['db'] {
    return this.config.db;
  }

  get eventEmitter(): UserEventEmitter {
    return this.config.eventEmitter;
  }

  /**
   * Emit item events
   * @param event
   * @param data
   */
  emitUserEvent(event: EventType, data: UserForEvent): void {
    this.eventEmitter.emitUserEvent(event, this.generateEventPayload(data));
  }

  /**
   * Generate the event payload for every item event
   * @param data
   * @private
   */
  private generateEventPayload(
    data: UserForEvent,
  ): BasicUserEventPayloadWithContext {
    return {
      user: {
        id: this.userId ?? data.userId,
        hashedId:
          this.headers.encodedid ??
          IntMask.encode(data.userId, config.secrets.intMask),
        email: this.headers.email ?? data.email,
        guid: parseInt(this.headers.guid),
        hashedGuid: this.headers.encodedguid,
        isPremium: this.headers.premium
          ? this.headers.premium === 'true'
          : data.isPremium,
      },
      apiUser: {
        apiId: this.apiId,
        name: this.headers.applicationname,
        isNative: this.headers.applicationisnative === 'true', // boolean value in header as string
        isTrusted: this.headers.applicationistrusted === 'true', // boolean value in header as string
        clientVersion: this.headers.clientversion,
      },
      request: {
        language: this.headers.gatewaylanguage,
        snowplowDomainUserId: this.headers.gatewaysnowplowdomainuserid,
        ipAddress: this.headers.gatewayipaddress,
        userAgent: this.headers.gatewayuseragent,
      },
    };
  }
}
