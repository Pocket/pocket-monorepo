import {
  BasicItemEventPayloadWithContext,
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
import {
  BasicListItemEventPayloadContext,
  ListPocketEventType,
} from '@pocket-tools/event-bridge';
import {
  PocketContext,
  PocketContextManager,
} from '@pocket-tools/apollo-utils';

export interface IContext extends PocketContext {
  dbClient: Knex;
  eventEmitter: ItemsEventEmitter;
  unleash: Unleash;
  eventContext: BasicListItemEventPayloadContext;
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
    event: ListPocketEventType,
    savedItem: SavedItem,
    tags?: string[],
  ): Promise<void>;
}

export class ContextManager extends PocketContextManager implements IContext {
  public readonly dataLoaders: IContext['dataLoaders'];
  public readonly unleash: Unleash;
  private _dbClient: Knex;
  private _writeClient: Knex;

  constructor(
    private config: {
      request: any;
      dbClient: Knex;
      eventEmitter: ItemsEventEmitter;
      unleash?: Unleash;
    },
  ) {
    super(config.request.headers);
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
    Sentry.getCurrentScope().setTag('pocket-api-id', super.apiId);
    Sentry.getCurrentScope().setUser({
      id: super.encodedUserId,
      ip_address: super.ip,
    });
  }
  headers: IncomingHttpHeaders;
  models: {
    item: ItemModel;
    tag: TagModel;
    pocketSave: PocketSaveModel;
    notFound: NotFoundErrorModel;
    savedItem: SavedItemModel;
  };

  get eventEmitter(): ItemsEventEmitter {
    return this.config.eventEmitter;
  }

  get dbClient(): Knex {
    return this._dbClient;
  }

  public get eventContext(): BasicListItemEventPayloadContext {
    return {
      user: {
        id: this.userId,
        hashedId: this.encodedUserId as string,
        email: this.email,
        guid: parseInt(this.guid),
        hashedGuid: this.encodedGuid,
        isPremium: this.userIsPremium,
      },
      apiUser: {
        apiId: this.apiId,
        name: this.applicationName,
        isNative: this.applicationIsNative,
        isTrusted: this.applicationIsTrusted,
        clientVersion: this.clientVersion,
      },
      request: {
        language: this.gatewayLanguage,
        snowplowDomainUserId: this.gatewaySnowplowDomainUserId,
        snowplowDomainSessionId: this.gatewaySnowplowDomainSessionId,
        ipAddress: this.ip,
        userAgent: this.gatewayUserAgent,
      },
    };
  }

  /**
   * Emit item events
   * @param event
   * @param savedItem
   * @param tagsUpdated tags updated during mutation
   */
  async emitItemEvent(
    event: ListPocketEventType,
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
      ...this.eventContext,
    };
  }
}
