import * as Sentry from '@sentry/node';
import { Visibility, ModerationStatus } from '.prisma/client';
import {
  ShareableListModerationReason,
  ShareableListComplete,
  ShareableListItem,
} from '../database/types';
import {
  generateShareableListEventBridgePayload,
  generateShareableListItemEventBridgePayload,
  sendEventHelper,
} from './events';
import { faker } from '@faker-js/faker';
import { serverLogger } from '@pocket-tools/ts-logger';
import winston from 'winston';
import {
  PocketEventBridgeClient,
  PocketEventType,
} from '@pocket-tools/event-bridge';

describe('Snowplow event helpers', () => {
  let sentryStub: jest.SpyInstance<string>;
  let crumbStub: jest.SpyInstance<void>;
  let loggerErrorSpy: jest.SpyInstance<winston.Logger>;
  let pocketEventBridgeClient: jest.SpyInstance;

  const shareableList: ShareableListComplete = {
    id: BigInt(99999),
    externalId: faker.string.uuid(),
    userId: BigInt(12345),
    slug: null,
    title: 'Fake Random Title',
    description: faker.lorem.sentences(2),
    status: Visibility.PRIVATE,
    listItemNoteVisibility: Visibility.PRIVATE,
    moderationStatus: ModerationStatus.VISIBLE,
    moderatedBy: null,
    moderationReason: null,
    moderationDetails: null,
    restorationReason: null,
    createdAt: new Date('2023-01-01 10:10:10'),
    updatedAt: new Date('2023-01-01 10:10:10'),
    listItems: [],
  };

  const shareableListItem: ShareableListItem = {
    externalId: faker.string.uuid(),
    itemId: BigInt(98765),
    url: `${faker.internet.url()}/${faker.lorem.slug(5)}`,
    title: faker.lorem.words(5),
    excerpt: faker.lorem.sentences(2),
    note: faker.lorem.sentences(1),
    imageUrl: faker.image.urlLoremFlickr({ category: 'cats' }),
    publisher: faker.company.name(),
    authors: `${faker.person.firstName()},${faker.person.firstName()}`,
    sortOrder: faker.number.int(),
    createdAt: new Date('2023-01-01 10:10:10'),
    updatedAt: new Date('2023-01-01 10:10:10'),
  };
  const shareableListItemExternalId = faker.string.uuid();

  beforeEach(() => {
    // we mock the send method on EventBridgeClient
    pocketEventBridgeClient = jest
      .spyOn(PocketEventBridgeClient.prototype, 'sendPocketEvent')
      .mockClear()
      .mockImplementation(() => Promise.resolve());
    sentryStub = jest
      .spyOn(Sentry, 'captureException')
      .mockClear()
      .mockImplementation(() => 'captured');
    loggerErrorSpy = jest.spyOn(serverLogger, 'error').mockClear();
    crumbStub = jest
      .spyOn(Sentry, 'addBreadcrumb')
      .mockClear()
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generateShareableListEventBridgePayload function', async () => {
    // SHAREABLE_LIST_CREATED
    let payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_CREATED,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-created
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_CREATED,
    );
    // now check that API obj properties have been mapped to the Snowplow obj properties

    // externalId -> shareable_list_external_id
    expect(payload.detail.shareableList.shareable_list_external_id).toBe(
      shareableList.externalId,
    );
    // userId -> user_id
    expect(payload.detail.shareableList.user_id).toBe(
      parseInt(shareableList.userId as unknown as string),
    );
    // expect slug to be undefined
    expect(payload.detail.shareableList.slug).toBeUndefined();
    // moderationStatus -> moderation_status
    expect(payload.detail.shareableList.moderation_status).toBe(
      shareableList.moderationStatus,
    );
    // moderatedBy -> moderated_by
    expect(payload.detail.shareableList.moderated_by).toBeUndefined();
    // moderationReason -> moderation_reason
    expect(payload.detail.shareableList.moderation_reason).toBeUndefined();
    // createdAt -> created_at in unix timestamp
    expect(payload.detail.shareableList.created_at).toBe(
      Math.floor(shareableList.createdAt.getTime() / 1000),
    );
    // updatedAt -> updated_at in unix timestamp
    expect(payload.detail.shareableList.updated_at).toBe(
      Math.floor(shareableList.updatedAt.getTime() / 1000),
    );

    // SHAREABLE_LIST_UPDATED
    // update some properties
    shareableList.title = 'Updated random title';
    shareableList.description = 'updated description';
    shareableList.updatedAt = new Date('2023-02-01 10:15:15');
    let newUpdatedAt = shareableList.updatedAt;
    payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_UPDATED,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-updated
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_UPDATED,
    );
    // userId -> user_id
    expect(payload.detail.shareableList.user_id).toBe(
      parseInt(shareableList.userId as unknown as string),
    );
    // check that title was updated
    expect(payload.detail.shareableList.title).toBe('Updated random title');
    // check that description was updated
    expect(payload.detail.shareableList.description).toBe(
      'updated description',
    );
    // updatedAt -> updated_at in seconds
    expect(payload.detail.shareableList.updated_at).toBe(
      Math.floor(newUpdatedAt.getTime() / 1000),
    );

    // SHAREABLE_LIST_PUBLISHED
    // update some properties
    shareableList.slug = 'updated-random-title';
    shareableList.status = Visibility.PUBLIC;
    shareableList.listItemNoteVisibility = Visibility.PUBLIC;
    shareableList.updatedAt = new Date('2023-02-01 10:15:45');
    newUpdatedAt = shareableList.updatedAt;
    payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_PUBLISHED,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-published
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_PUBLISHED,
    );
    // userId -> user_id
    expect(payload.detail.shareableList.user_id).toBe(
      parseInt(shareableList.userId as unknown as string),
    );
    // expect slug to not be null
    expect(payload.detail.shareableList.slug).toBe(shareableList.slug);
    // check that status was updated to PUBLIC
    expect(payload.detail.shareableList.status).toBe(Visibility.PUBLIC);
    // check that listItemNoteVisibility was updated to PUBLIC
    expect(payload.detail.shareableList.list_item_note_visibility).toBe(
      Visibility.PUBLIC,
    );
    // updatedAt -> updated_at in seconds
    expect(payload.detail.shareableList.updated_at).toBe(
      Math.floor(newUpdatedAt.getTime() / 1000),
    );

    // SHAREABLE_LIST_UNPUBLISHED
    // update some properties
    shareableList.status = Visibility.PRIVATE;
    shareableList.listItemNoteVisibility = Visibility.PRIVATE;
    shareableList.updatedAt = new Date('2023-02-02 10:15:07');
    newUpdatedAt = shareableList.updatedAt;
    payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_UNPUBLISHED,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-unpublished
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_UNPUBLISHED,
    );
    // userId -> user_id
    expect(payload.detail.shareableList.user_id).toBe(
      parseInt(shareableList.userId as unknown as string),
    );
    // check that status was updated to PRIVATE
    expect(payload.detail.shareableList.status).toBe(Visibility.PRIVATE);
    // check that listItemNoteVisibility was updated to PRIVATE
    expect(payload.detail.shareableList.list_item_note_visibility).toBe(
      Visibility.PRIVATE,
    );
    // updatedAt -> updated_at in seconds
    expect(payload.detail.shareableList.updated_at).toBe(
      Math.floor(newUpdatedAt.getTime() / 1000),
    );

    // SHAREABLE_LIST_DELETED
    // simulate shareable-list-deleted event
    payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_DELETED,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-deleted
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_DELETED,
    );

    // SHAREABLE_LIST_HIDDEN
    // update some properties
    shareableList.moderationStatus = ModerationStatus.HIDDEN;
    shareableList.moderationReason = ShareableListModerationReason.SPAM;
    shareableList.moderationDetails = 'more details here';
    shareableList.updatedAt = new Date('2023-02-03 05:15:43');
    newUpdatedAt = shareableList.updatedAt;
    payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_HIDDEN,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-hidden
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_HIDDEN,
    );
    // userId -> user_id
    expect(payload.detail.shareableList.user_id).toBe(
      parseInt(shareableList.userId as unknown as string),
    );
    // check that moderation_status was updated to HIDDEN
    expect(payload.detail.shareableList.moderation_status).toBe(
      ModerationStatus.HIDDEN,
    );
    // check that moderation_reason exists
    expect(payload.detail.shareableList.moderation_reason).toBe(
      ShareableListModerationReason.SPAM,
    );
    // check that moderation_details exists
    expect(payload.detail.shareableList.moderation_details).toBe(
      'more details here',
    );
    // updatedAt -> updated_at in seconds
    expect(payload.detail.shareableList.updated_at).toBe(
      Math.floor(newUpdatedAt.getTime() / 1000),
    );

    // SHAREABLE_LIST_UNHIDDEN
    // update some properties
    shareableList.moderationStatus = ModerationStatus.VISIBLE;
    shareableList.restorationReason = 'restoring list';
    shareableList.updatedAt = new Date('2023-02-04 05:15:43');
    newUpdatedAt = shareableList.updatedAt;
    payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_UNHIDDEN,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-hidden
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_UNHIDDEN,
    );
    // userId -> user_id
    expect(payload.detail.shareableList.user_id).toBe(
      parseInt(shareableList.userId as unknown as string),
    );
    // check that moderation_status was updated to VISIBLE
    expect(payload.detail.shareableList.moderation_status).toBe(
      ModerationStatus.VISIBLE,
    );
    // check that restoration_reason exists
    expect(payload.detail.shareableList.restoration_reason).toBe(
      'restoring list',
    );
    // updatedAt -> updated_at in seconds
    expect(payload.detail.shareableList.updated_at).toBe(
      Math.floor(newUpdatedAt.getTime() / 1000),
    );

    // Lets mimick a shareable_list_created event with a bad userId
    shareableList.userId = null;
    payload = generateShareableListEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_CREATED,
      shareableList,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableList).not.toBeNull();
    // check that the payload event type is for shareable-list-created
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_CREATED,
    );
    // userId -> user_id should be undefined
    expect(payload.detail.shareableList.user_id).toBeUndefined();
    // Expect message to get logged in Sentry
    expect(sentryStub).toHaveBeenCalledTimes(1);
    expect(sentryStub.mock.calls[0][0]).toBe('Events: Failed to parse userId');
    // set the userId back to a good one
    shareableList.userId = BigInt(12345);
  });

  it('generateShareableListItemEventBridgePayload function', async () => {
    // SHAREABLE_LIST_ITEM_CREATED
    let payload = generateShareableListItemEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_ITEM_CREATED,
      shareableListItem,
      shareableListItemExternalId,
      shareableList.externalId,
    );
    // shareableListItem obj must not be null
    expect(payload.detail.shareableListItem).not.toBeNull();
    // check that the payload event type is for shareable-list-item-created
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_ITEM_CREATED,
    );
    // now check that API obj properties have been mapped to the Snowplow obj properties

    // externalId -> shareable_list_item_external_id
    expect(
      payload.detail.shareableListItem.shareable_list_item_external_id,
    ).toBe(shareableListItemExternalId);
    // listId -> shareable_list_external_id
    expect(payload.detail.shareableListItem.shareable_list_external_id).toBe(
      shareableList.externalId,
    );
    // url-> given_url
    expect(payload.detail.shareableListItem.given_url).toBe(
      shareableListItem.url,
    );

    // imageUrl-> image_url
    expect(payload.detail.shareableListItem.image_url).toBe(
      shareableListItem.imageUrl,
    );
    // authors string getting mapped to array of strings
    expect(JSON.stringify(payload.detail.shareableListItem.authors)).toBe(
      JSON.stringify(shareableListItem.authors.split(',')),
    );
    // publisher
    expect(payload.detail.shareableListItem.publisher).toBe(
      shareableListItem.publisher,
    );
    // note
    expect(payload.detail.shareableListItem.note).toBe(shareableListItem.note);
    // sortOrder -> sort_order
    expect(payload.detail.shareableListItem.sort_order).toBe(
      shareableListItem.sortOrder,
    );
    // createdAt -> created_at in unix timestamp
    expect(payload.detail.shareableListItem.created_at).toBe(
      Math.floor(shareableListItem.createdAt.getTime() / 1000),
    );
    // updatedAt -> updated_at in unix timestamp
    expect(payload.detail.shareableListItem.updated_at).toBe(
      Math.floor(shareableListItem.updatedAt.getTime() / 1000),
    );

    // SHAREABLE_LIST_ITEM_UPDATED
    shareableListItem.note = 'new note updated';
    shareableListItem.sortOrder = 5;
    shareableListItem.updatedAt = new Date('2023-02-05 05:15:43');
    payload = generateShareableListItemEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_ITEM_UPDATED,
      shareableListItem,
      shareableListItemExternalId,
      shareableList.externalId,
    );
    // shareableListItem obj must not be null
    expect(payload.detail.shareableListItem).not.toBeNull();
    // check that the payload event type is for shareable-list-item-updated
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_ITEM_UPDATED,
    );
    // now check that note & sortOrder were correctly mapped and updated
    // note
    expect(payload.detail.shareableListItem.note).toBe('new note updated');
    expect(payload.detail.shareableListItem.sort_order).toBe(5);
    // updatedAt -> updated_at in unix timestamp
    expect(payload.detail.shareableListItem.updated_at).toBe(
      Math.floor(shareableListItem.updatedAt.getTime() / 1000),
    );

    // SHAREABLE_LIST_ITEM_DELETED
    payload = generateShareableListItemEventBridgePayload(
      PocketEventType.SHAREABLE_LIST_ITEM_DELETED,
      shareableListItem,
      shareableListItemExternalId,
      shareableList.externalId,
    );
    // shareableList obj must not be null
    expect(payload.detail.shareableListItem).not.toBeNull();
    // check that the payload event type is for shareable-list-item-deleted
    expect(payload.detail.eventType).toBe(
      PocketEventType.SHAREABLE_LIST_ITEM_DELETED,
    );
  });
  describe('sendEventHelper function', () => {
    it('should send shareable-list event to event bus with proper event data', async () => {
      // send shareable-list event
      await sendEventHelper(PocketEventType.SHAREABLE_LIST_CREATED, {
        shareableList: shareableList,
      });

      // shareableList obj must not be null
      expect(
        pocketEventBridgeClient.mock.calls[0][0].detail.shareableList,
      ).not.toBeNull();
      expect(sentryStub).toHaveBeenCalledTimes(0);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    });
    it('should send shareable-list-item event to event bus with proper event data', async () => {
      // send shareable-list event
      await sendEventHelper(PocketEventType.SHAREABLE_LIST_ITEM_CREATED, {
        shareableListItem,
        shareableListItemExternalId,
        listExternalId: shareableList.externalId,
      });

      // shareableList obj must not be null
      expect(
        pocketEventBridgeClient.mock.calls[0][0].detail.shareableListItem,
      ).not.toBeNull();
      expect(sentryStub).toHaveBeenCalledTimes(0);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);

      expect(sentryStub).toHaveBeenCalledTimes(0);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    });
  });
});
