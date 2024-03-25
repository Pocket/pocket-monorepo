import { AuthenticationError } from '@pocket-tools/apollo-utils';
import {
  BasicItemEventPayloadWithContext,
  EventType,
  ItemsEventEmitter,
} from '../businessEvents';
import { IncomingHttpHeaders } from 'http';
import { Knex } from 'knex';
import { SavedItem, Tag } from '../types';
import DataLoader from 'dataloader';
import { createSavedItemDataLoaders } from '../dataLoader/savedItemsDataLoader';
import { createTagDataLoaders } from '../dataLoader/tagsDataLoader';
import * as Sentry from '@sentry/node';
import {
  PocketSaveModel,
  NotFoundErrorModel,
  ItemModel,
  TagModel,
} from '../models';
import { SavedItemModel } from '../models/SavedItem';
import { Unleash } from 'unleash-client';
import { getClient } from '../featureFlags';

export interface IContext {
  userId: string;
  headers: IncomingHttpHeaders;
  apiId: string;
  userIsPremium: boolean;
  dbClient: Knex;
  eventEmitter: ItemsEventEmitter;
  unleash: Unleash;
  models: {
    tag: TagModel;
    pocketSave: PocketSaveModel;
    notFound: NotFoundErrorModel;
    item: ItemModel;
    savedItem: SavedItemModel;
  };
  dataLoaders: {
    savedItemsById: DataLoader<string, SavedItem>;
    savedItemsByUrl: DataLoader<string, SavedItem>;
    tagsById: DataLoader<string, Tag>;
    tagsByName: DataLoader<string, Tag>;
    tagsByItemId: DataLoader<string, Tag[]>;
  };

  emitItemEvent(
    event: EventType,
    savedItem: SavedItem,
    tags?: string[],
  ): Promise<void>;
}

export class ContextManager implements IContext {
  public readonly dataLoaders: IContext['dataLoaders'];
  public readonly unleash: Unleash;
  private _dbClient: Knex;

  constructor(
    private config: {
      request: any;
      dbClient: Knex;
      eventEmitter: ItemsEventEmitter;
      unleash?: Unleash;
    },
  ) {
    this.unleash = config.unleash || getClient();
    this._dbClient = config.dbClient;
    this.dataLoaders = {
      ...createTagDataLoaders(this),
      ...createSavedItemDataLoaders(this),
    };
    this.models = {
      item: new ItemModel(),
      tag: new TagModel(this),
      pocketSave: new PocketSaveModel(this),
      notFound: new NotFoundErrorModel(),
      savedItem: new SavedItemModel(this),
    };
    // Set tracking data for Sentry
    Sentry.configureScope((scope) => {
      scope.setTag(
        'pocket-api-id',
        (config.request.headers.apiid || '0') as string,
      );
      scope.setUser({
        id: config.request.headers.encodedid as string,
        ip_address: config.request.headers.gatewayipaddress as string,
      });
    });
  }
  models: {
    item: ItemModel;
    tag: TagModel;
    pocketSave: PocketSaveModel;
    notFound: NotFoundErrorModel;
    savedItem: SavedItemModel;
  };

  get headers(): { [key: string]: any } {
    return this.config.request.headers;
  }

  get userId(): string {
    const userId = this.headers.userid;

    if (!userId) {
      throw new AuthenticationError(
        'You must be logged in to use this service',
      );
    }

    return userId instanceof Array ? userId[0] : userId;
  }

  get userIsPremium(): boolean {
    const userIsPremium = this.headers.premium;
    //check that we have a premium header, and if it is set to true
    return userIsPremium !== undefined && userIsPremium === 'true';
  }

  get apiId(): string {
    const apiId = this.headers.apiid || '0';

    return apiId instanceof Array ? apiId[0] : apiId;
  }

  get eventEmitter(): ItemsEventEmitter {
    return this.config.eventEmitter;
  }

  get dbClient(): Knex {
    return this._dbClient;
  }

  /**
   * Emit item events
   * @param event
   * @param savedItem
   * @param tagsUpdated tags updated during mutation
   */
  async emitItemEvent(
    event: EventType,
    savedItem: SavedItem,
    tagsUpdated?: string[],
  ): Promise<void> {
    if (savedItem == null) {
      Sentry.captureEvent({
        message: 'Save was null or undefined when generating event payload',
        level: 'warning',
      });
      return;
    }
    try {
      const tags = (await this.models.tag.getBySaveId(savedItem.id)).map(
        (_) => _.name,
      );

      const payload = this.generateEventPayload(savedItem, tags, tagsUpdated);
      this.eventEmitter.emitItemEvent(event, payload);
    } catch (error) {
      Sentry.captureException(error, { level: 'warning' });
    }
  }

  /**
   * Generate the event payload for every item event
   * @param savedItem
   * @param tagsUpdated
   * @private
   */
  private generateEventPayload(
    save: SavedItem,
    tags: string[],
    tagsUpdated: string[],
  ): BasicItemEventPayloadWithContext {
    return {
      savedItem: save,
      tags,
      tagsUpdated,
      user: {
        id: this.userId,
        hashedId: this.headers.encodedid,
        email: this.headers.email,
        guid: parseInt(this.headers.guid),
        hashedGuid: this.headers.encodedguid,
        isPremium: this.userIsPremium,
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
