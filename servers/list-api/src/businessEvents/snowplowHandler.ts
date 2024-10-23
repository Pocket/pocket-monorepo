import * as Sentry from '@sentry/node';
import { buildSelfDescribingEvent, Tracker } from '@snowplow/node-tracker';
import {
  ItemEventPayload,
  SnowplowEventMap,
  SnowplowSavedItemStatusMap,
} from './types';
import { PayloadBuilder, SelfDescribingJson } from '@snowplow/tracker-core';
import {
  ApiUser,
  Content,
  ListItem,
  ListItemUpdate,
  User,
} from '../snowplow/schema';
import { ItemsEventEmitter } from './itemsEventEmitter';
import config from '../config';
import { SavedItem } from '../types';
import { serverLogger } from '@pocket-tools/ts-logger';

type ListItemUpdateEvent = Omit<SelfDescribingJson, 'data'> & {
  data: ListItemUpdate;
};

type ListItemContext = Omit<SelfDescribingJson, 'data'> & {
  data: ListItem;
};

type ContentContext = Omit<SelfDescribingJson, 'data'> & {
  data: Content;
};

type UserContext = Omit<SelfDescribingJson, 'data'> & {
  data: User;
};

type ApiUserContext = Omit<SelfDescribingJson, 'data'> & {
  data: ApiUser;
};

export class SnowplowHandler {
  constructor(
    private emitter: ItemsEventEmitter,
    private tracker: Tracker,
    events: string[],
  ) {
    // register handler for item events
    events.forEach((event) => emitter.on(event, (data) => this.process(data)));
  }

  /**
   * @param data
   */
  async process(data: ItemEventPayload): Promise<void> {
    this.addRequestInfoToTracker(data);
    const event = buildSelfDescribingEvent({
      event: SnowplowHandler.generateListItemUpdateEvent(data),
    });
    const context = await SnowplowHandler.generateEventContext(data);
    await this.track(event, context);
  }

  /**
   * Track snowplow event
   * @param event
   * @param context
   * @private
   */
  private async track(
    event: PayloadBuilder,
    context: SelfDescribingJson[],
  ): Promise<void> {
    try {
      await this.tracker.track(event, context);
    } catch (ex) {
      serverLogger.error('Failed to send event to snowplow', {
        event,
        context,
        error: ex,
      });
      const message = `Failed to send event to snowplow.\n event: ${event}\n context: ${context}`;
      Sentry.addBreadcrumb({ message });
      Sentry.captureException(ex);
    }
  }

  /**
   * @private
   */
  private static async generateEventContext(
    data: ItemEventPayload,
  ): Promise<SelfDescribingJson[]> {
    return [
      await SnowplowHandler.generateListItemContext(data),
      await SnowplowHandler.generateContentContext(data),
      SnowplowHandler.generateUserContext(data),
      SnowplowHandler.generateApiUserContext(data),
    ];
  }

  /**
   * @private
   */
  private static generateListItemUpdateEvent(
    data: ItemEventPayload,
  ): ListItemUpdateEvent {
    return {
      schema: config.snowplow.schemas.listItemUpdate,
      data: {
        trigger: SnowplowEventMap[data.eventType],
      },
    };
  }

  /**
   * @private
   */
  private static async generateListItemContext(
    data: ItemEventPayload,
  ): Promise<ListItemContext> {
    const savedItem: SavedItem = await data.savedItem;
    return {
      schema: config.snowplow.schemas.listItem,
      data: {
        object_version: 'new',
        url: savedItem.url,
        item_id: parseInt(savedItem.id),
        status: SnowplowSavedItemStatusMap[savedItem.status],
        is_favorited: !!savedItem.isFavorite,
        tags: (await data.tags) ?? [],
        created_at: savedItem._createdAt ?? Date.now(),
      },
    };
  }

  /**
   * @private
   */
  private static async generateContentContext(
    data: ItemEventPayload,
  ): Promise<ContentContext> {
    const savedItem: SavedItem = await data.savedItem;
    return {
      schema: config.snowplow.schemas.content,
      data: {
        url: savedItem.url,
        item_id: parseInt(savedItem.id),
      },
    };
  }

  /**
   * @private
   */
  private static generateUserContext(data: ItemEventPayload): UserContext {
    return {
      schema: config.snowplow.schemas.user,
      data: {
        email: data.user.email,
        guid: data.user.guid,
        hashed_guid: data.user.hashedGuid,
        user_id: parseInt(data.user.id),
        hashed_user_id: data.user.hashedId,
      },
    };
  }

  /**
   * @private
   */
  private static generateApiUserContext(
    data: ItemEventPayload,
  ): ApiUserContext {
    return {
      schema: config.snowplow.schemas.apiUser,
      data: {
        api_id: parseInt(data.apiUser.apiId),
        name: data.apiUser.name,
        is_native: data.apiUser.isNative,
        is_trusted: data.apiUser.isTrusted,
        client_version: data.apiUser.clientVersion,
      },
    };
  }

  /**
   * Updates tracker with request information
   * @private
   */
  private addRequestInfoToTracker(data: ItemEventPayload) {
    if (data.request?.language) this.tracker.setLang(data.request.language);

    if (data.request?.snowplowDomainUserId)
      this.tracker.setDomainUserId(data.request.snowplowDomainUserId); // possibly grab from cookie else grab from context

    if (data.request?.snowplowDomainSessionId)
      this.tracker.setSessionId(data.request.snowplowDomainSessionId);
    if (data.request?.ipAddress)
      this.tracker.setIpAddress(data.request.ipAddress); // get the remote address from teh x-forwarded-for header

    if (data.request?.userAgent)
      this.tracker.setUseragent(data.request.userAgent);

    if (data.user.hashedId) this.tracker.setUserId(data.user.hashedId);
  }
}
