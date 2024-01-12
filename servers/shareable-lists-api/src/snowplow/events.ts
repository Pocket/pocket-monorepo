import {
  PutEventsCommand,
  PutEventsCommandOutput,
} from '@aws-sdk/client-eventbridge';
import * as Sentry from '@sentry/node';
import config from '../config/';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import { ShareableListComplete, ShareableListItem } from '../database/types';
import {
  EventBridgeEventType,
  EventBridgeEventOptions,
  SnowplowShareableList,
  SnowplowShareableListItem,
  ShareableListEventBusPayload,
  ShareableListItemEventBusPayload,
} from './types';
import { serverLogger } from '../express';

/**
 * This function takes in the API Shareable List object and transforms it into a Snowplow Shareable List object
 * @param shareableList
 */
function transformAPIShareableListToSnowplowShareableList(
  shareableList: ShareableListComplete
): SnowplowShareableList {
  // userId should always be present, but if for some reason it cannot be parsed,
  // return undefined as userId is not required in Snowplow schema. Log to Sentry.
  let userId;
  if (isNaN(parseInt(shareableList.userId as unknown as string))) {
    userId = undefined;
    Sentry.captureException('Snowplow: Failed to parse userId');
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
    status: shareableList.status,
    list_item_note_visibility: shareableList.listItemNoteVisibility,
    moderation_status: shareableList.moderationStatus,
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
  listExternalId: string
): SnowplowShareableListItem {
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
  eventType: EventBridgeEventType,
  shareableList: ShareableListComplete
): ShareableListEventBusPayload {
  return {
    shareableList:
      transformAPIShareableListToSnowplowShareableList(shareableList),
    eventType: eventType,
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
  eventType: EventBridgeEventType,
  shareableListItem: ShareableListItem,
  externalId: string,
  listExternalId: string
): ShareableListItemEventBusPayload {
  return {
    shareableListItem: transformAPIShareableListItemToSnowplowShareableListItem(
      shareableListItem,
      externalId,
      listExternalId
    ),
    eventType: eventType,
  };
}

/**
 * This method prepares the payload to send to the Event Bridge.
 *
 * @param eventType
 * @param options
 */
export async function sendEventHelper(
  eventType: EventBridgeEventType,
  options: EventBridgeEventOptions
) {
  let payload;
  if (options.shareableList) {
    payload = generateShareableListEventBridgePayload(
      eventType,
      options.shareableList
    );
  }

  if (options.shareableListItem) {
    payload = generateShareableListItemEventBridgePayload(
      eventType,
      options.shareableListItem,
      options.shareableListItemExternalId,
      options.listExternalId
    );
  }
  // Send payload to Event Bridge.
  try {
    await sendEvent(
      payload,
      options.isShareableListEventType,
      options.isShareableListItemEventType
    );
  } catch (error) {
    // In the unlikely event that the payload generator throws an error,
    // log to Sentry and Cloudwatch but don't halt program
    const failedEventError = new Error(
      `Failed to send event '${
        payload.eventType
      }' to event bus. Event Body:\n ${JSON.stringify(payload)}`
    );
    // Don't halt program, but capture the failure in Sentry and Cloudwatch
    Sentry.addBreadcrumb(failedEventError);
    Sentry.captureException(error);
    serverLogger.error({
      error: failedEventError,
      message: failedEventError.message,
      data: error,
    });
  }
}

/**
 * Send event to Event Bus, pulling the event bus and the event source
 * from the config.
 * Will not throw errors if event fails; instead, log exception to Sentry
 * and add to Cloudwatch logs.
 *
 *
 * @param eventPayload the payload to send to event bus
 * @param isShareableListEventType
 * @param isShareableListItemEventType
 */
export async function sendEvent(
  eventPayload: any,
  isShareableListEventType: boolean,
  isShareableListItemEventType: boolean
) {
  let eventBridgeSource;
  if (isShareableListEventType) {
    eventBridgeSource = config.aws.eventBus.eventBridge.shareableList.source;
  }
  if (isShareableListItemEventType) {
    eventBridgeSource =
      config.aws.eventBus.eventBridge.shareableListItem.source;
  }
  const putEventCommand = new PutEventsCommand({
    Entries: [
      {
        EventBusName: config.aws.eventBus.name,
        Detail: JSON.stringify(eventPayload),
        Source: eventBridgeSource,
        DetailType: eventPayload.eventType,
      },
    ],
  });

  const output: PutEventsCommandOutput = await eventBridgeClient.send(
    putEventCommand
  );

  if (output.FailedEntryCount) {
    const failedEventError = new Error(
      `Failed to send event '${
        eventPayload.eventType
      }' to event bus. Event Body:\n ${JSON.stringify(eventPayload)}`
    );

    // Don't halt program, but capture the failure in Sentry and Cloudwatch
    Sentry.captureException(failedEventError);
    serverLogger.error({
      error: failedEventError,
      message: failedEventError.message,
    });
  }
}
