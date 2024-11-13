import * as Sentry from '@sentry/node';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import { ShareableListComplete, ShareableListItem } from '../database/types';
import {
  ShareableListItem as EventBridgeShareableListItem,
  ShareableList as EventBridgeShareableList,
  ShareableListItemEvent,
  ShareableListEvent,
  ShareableListPocketEventType,
  ShareableListItemPocketEventType,
} from '@pocket-tools/event-bridge';
import {
  shareableListModerationMapper,
  shareableListVisibilityMapper,
} from './utils';
import config from '../config';

/**
 * This function takes in the API Shareable List object and transforms it into a Snowplow Shareable List object
 * @param shareableList
 */
function transformAPIShareableListToSnowplowShareableList(
  shareableList: ShareableListComplete,
): EventBridgeShareableList {
  // userId should always be present, but if for some reason it cannot be parsed,
  // return undefined as userId is not required in Snowplow schema. Log to Sentry.
  let userId: number | undefined;
  if (isNaN(parseInt(shareableList.userId as unknown as string))) {
    userId = undefined;
    Sentry.captureException('Events: Failed to parse userId');
  } else {
    userId = parseInt(shareableList.userId as unknown as string);
  }
  return {
    shareable_list_external_id: shareableList.externalId,
    user_id: userId,
    slug: shareableList.slug ? shareableList.slug : undefined,
    title: shareableList.title,
    description: shareableList.description
      ? shareableList.description
      : undefined,
    status: shareableListVisibilityMapper(shareableList.status),
    list_item_note_visibility: shareableListVisibilityMapper(
      shareableList.listItemNoteVisibility,
    ),
    moderation_status: shareableListModerationMapper(
      shareableList.moderationStatus,
    ),
    moderated_by: shareableList.moderatedBy
      ? shareableList.moderatedBy
      : undefined,
    moderation_reason: shareableList.moderationReason
      ? shareableList.moderationReason
      : undefined,
    moderation_details: shareableList.moderationDetails
      ? shareableList.moderationDetails
      : undefined,
    restoration_reason: shareableList.restorationReason
      ? shareableList.restorationReason
      : undefined,
    created_at: Math.floor(shareableList.createdAt.getTime() / 1000),
    updated_at: shareableList.updatedAt
      ? Math.floor(shareableList.updatedAt.getTime() / 1000)
      : undefined,
  };
}

/**
 * This function takes in the API Shareable List Item object and transforms it into a Snowplow Shareable List Item object
 * @param shareableListItem
 * @param externalId
 * @param listExternalId
 */
function transformAPIShareableListItemToSnowplowShareableListItem(
  shareableListItem: ShareableListItem,
  externalId: string,
  listExternalId: string,
): EventBridgeShareableListItem {
  return {
    shareable_list_item_external_id: externalId,
    shareable_list_external_id: listExternalId,
    given_url: shareableListItem.url,
    title: shareableListItem.title ? shareableListItem.title : undefined,
    excerpt: shareableListItem.excerpt ? shareableListItem.excerpt : undefined,
    image_url: shareableListItem.imageUrl
      ? shareableListItem.imageUrl
      : undefined,
    authors: shareableListItem.authors
      ? shareableListItem.authors.split(',')
      : undefined,
    publisher: shareableListItem.publisher
      ? shareableListItem.publisher
      : undefined,
    note: shareableListItem.note ? shareableListItem.note : undefined,
    sort_order: shareableListItem.sortOrder,
    created_at: Math.floor(shareableListItem.createdAt.getTime() / 1000),
    updated_at: shareableListItem.updatedAt
      ? Math.floor(shareableListItem.updatedAt.getTime() / 1000)
      : undefined,
  };
}

/**
 * This method sets up the payload to send to Event Bridge for shareable-list mutations
 *
 * @param eventType
 * @param shareableList
 */
export function generateShareableListEventBridgePayload(
  eventType: ShareableListPocketEventType,
  shareableList: ShareableListComplete,
): ShareableListEvent {
  return {
    detail: {
      shareableList:
        transformAPIShareableListToSnowplowShareableList(shareableList),
      eventType: eventType,
    },
    source: config.aws.eventBus.eventBridge.shareableList.source,
    'detail-type': eventType,
  };
}

/**
 * This method sets up the payload to send to Event Bridge for shareable-list-item mutations
 *
 * @param eventType
 * @param shareableListItem
 * @param externalId
 * @param listExternalId
 */
export function generateShareableListItemEventBridgePayload(
  eventType: ShareableListItemPocketEventType,
  shareableListItem: ShareableListItem,
  externalId: string,
  listExternalId: string,
): ShareableListItemEvent {
  return {
    detail: {
      shareableListItem:
        transformAPIShareableListItemToSnowplowShareableListItem(
          shareableListItem,
          externalId,
          listExternalId,
        ),
      eventType: eventType,
    },
    source: config.aws.eventBus.eventBridge.shareableListItem.source,
    'detail-type': eventType,
  };
}

/**
 * This method prepares the payload to send to the Event Bridge.
 *
 * @param eventType
 * @param options
 */
export async function sendEventHelper(
  eventType: ShareableListItemPocketEventType | ShareableListPocketEventType,
  options: {
    shareableList?: ShareableListComplete;
    shareableListItem?: ShareableListItem;
    shareableListItemExternalId?: string;
    listExternalId?: string;
  },
) {
  let event: ShareableListItemEvent | ShareableListEvent;
  if (options.shareableList) {
    event = generateShareableListEventBridgePayload(
      eventType as ShareableListPocketEventType,
      options.shareableList,
    );
  }

  if (options.shareableListItem) {
    event = generateShareableListItemEventBridgePayload(
      eventType as ShareableListItemPocketEventType,
      options.shareableListItem,
      options.shareableListItemExternalId,
      options.listExternalId,
    );
  }

  await eventBridgeClient.sendPocketEvent(event);
}
