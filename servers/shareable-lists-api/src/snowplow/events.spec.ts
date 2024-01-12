import sinon from 'sinon';
import { expect } from 'chai';
import * as Sentry from '@sentry/node';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { Visibility, ModerationStatus } from '@prisma/client';
import {
  ShareableListModerationReason,
  ShareableListComplete,
  ShareableListItem,
} from '../database/types';
import {
  generateShareableListEventBridgePayload,
  generateShareableListItemEventBridgePayload,
  sendEvent,
  sendEventHelper,
} from './events';
import { EventBridgeEventType } from './types';
import { faker } from '@faker-js/faker';
import { serverLogger } from '../express';

describe('Snowplow event helpers', () => {
  let eventBridgeClientStub: sinon.SinonStub;
  let sentryStub;
  let crumbStub;
  let loggerErrorSpy;

  const shareableList: ShareableListComplete = {
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
    eventBridgeClientStub = sinon
      .stub(EventBridgeClient.prototype, 'send')
      .resolves({ FailedEntryCount: 0 });
    sentryStub = sinon.stub(Sentry, 'captureException').resolves();
    loggerErrorSpy = sinon.spy(serverLogger, 'error');
    crumbStub = sinon.stub(Sentry, 'addBreadcrumb').resolves();
  });

  afterEach(() => {
    eventBridgeClientStub.restore();
    sentryStub.restore();
    loggerErrorSpy.restore();
    crumbStub.restore();
  });

  it('generateShareableListEventBridgePayload function', async () => {
    // SHAREABLE_LIST_CREATED
    let payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_CREATED,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-created
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_CREATED
    );
    // now check that API obj properties have been mapped to the Snowplow obj properties

    // externalId -> shareable_list_external_id
    expect(payload.shareableList.shareable_list_external_id).to.equal(
      shareableList.externalId
    );
    // userId -> user_id
    expect(payload.shareableList.user_id).to.equal(
      parseInt(shareableList.userId as unknown as string)
    );
    // expect slug to be undefined
    expect(payload.shareableList.slug).to.equal(undefined);
    // moderationStatus -> moderation_status
    expect(payload.shareableList.moderation_status).to.equal(
      shareableList.moderationStatus
    );
    // moderatedBy -> moderated_by
    expect(payload.shareableList.moderated_by).to.equal(undefined);
    // moderationReason -> moderation_reason
    expect(payload.shareableList.moderation_reason).to.equal(undefined);
    // createdAt -> created_at in unix timestamp
    expect(payload.shareableList.created_at).to.equal(
      Math.floor(shareableList.createdAt.getTime() / 1000)
    );
    // updatedAt -> updated_at in unix timestamp
    expect(payload.shareableList.updated_at).to.equal(
      Math.floor(shareableList.updatedAt.getTime() / 1000)
    );

    // SHAREABLE_LIST_UPDATED
    // update some properties
    shareableList.title = 'Updated random title';
    shareableList.description = 'updated description';
    shareableList.updatedAt = new Date('2023-02-01 10:15:15');
    let newUpdatedAt = shareableList.updatedAt;
    payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_UPDATED,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-updated
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_UPDATED
    );
    // userId -> user_id
    expect(payload.shareableList.user_id).to.equal(
      parseInt(shareableList.userId as unknown as string)
    );
    // check that title was updated
    expect(payload.shareableList.title).to.equal('Updated random title');
    // check that description was updated
    expect(payload.shareableList.description).to.equal('updated description');
    // updatedAt -> updated_at in seconds
    expect(payload.shareableList.updated_at).to.equal(
      Math.floor(newUpdatedAt.getTime() / 1000)
    );

    // SHAREABLE_LIST_PUBLISHED
    // update some properties
    shareableList.slug = 'updated-random-title';
    shareableList.status = Visibility.PUBLIC;
    shareableList.listItemNoteVisibility = Visibility.PUBLIC;
    shareableList.updatedAt = new Date('2023-02-01 10:15:45');
    newUpdatedAt = shareableList.updatedAt;
    payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_PUBLISHED,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-published
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_PUBLISHED
    );
    // userId -> user_id
    expect(payload.shareableList.user_id).to.equal(
      parseInt(shareableList.userId as unknown as string)
    );
    // expect slug to not be null
    expect(payload.shareableList.slug).to.equal(shareableList.slug);
    // check that status was updated to PUBLIC
    expect(payload.shareableList.status).to.equal(Visibility.PUBLIC);
    // check that listItemNoteVisibility was updated to PUBLIC
    expect(payload.shareableList.list_item_note_visibility).to.equal(
      Visibility.PUBLIC
    );
    // updatedAt -> updated_at in seconds
    expect(payload.shareableList.updated_at).to.equal(
      Math.floor(newUpdatedAt.getTime() / 1000)
    );

    // SHAREABLE_LIST_UNPUBLISHED
    // update some properties
    shareableList.status = Visibility.PRIVATE;
    shareableList.listItemNoteVisibility = Visibility.PRIVATE;
    shareableList.updatedAt = new Date('2023-02-02 10:15:07');
    newUpdatedAt = shareableList.updatedAt;
    payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_UNPUBLISHED,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-unpublished
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_UNPUBLISHED
    );
    // userId -> user_id
    expect(payload.shareableList.user_id).to.equal(
      parseInt(shareableList.userId as unknown as string)
    );
    // check that status was updated to PRIVATE
    expect(payload.shareableList.status).to.equal(Visibility.PRIVATE);
    // check that listItemNoteVisibility was updated to PRIVATE
    expect(payload.shareableList.list_item_note_visibility).to.equal(
      Visibility.PRIVATE
    );
    // updatedAt -> updated_at in seconds
    expect(payload.shareableList.updated_at).to.equal(
      Math.floor(newUpdatedAt.getTime() / 1000)
    );

    // SHAREABLE_LIST_DELETED
    // simulate shareable-list-deleted event
    payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_DELETED,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-deleted
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_DELETED
    );

    // SHAREABLE_LIST_HIDDEN
    // update some properties
    shareableList.moderationStatus = ModerationStatus.HIDDEN;
    shareableList.moderationReason = ShareableListModerationReason.SPAM;
    shareableList.moderationDetails = 'more details here';
    shareableList.updatedAt = new Date('2023-02-03 05:15:43');
    newUpdatedAt = shareableList.updatedAt;
    payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_HIDDEN,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-hidden
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_HIDDEN
    );
    // userId -> user_id
    expect(payload.shareableList.user_id).to.equal(
      parseInt(shareableList.userId as unknown as string)
    );
    // check that moderation_status was updated to HIDDEN
    expect(payload.shareableList.moderation_status).to.equal(
      ModerationStatus.HIDDEN
    );
    // check that moderation_reason exists
    expect(payload.shareableList.moderation_reason).to.equal(
      ShareableListModerationReason.SPAM
    );
    // check that moderation_details exists
    expect(payload.shareableList.moderation_details).to.equal(
      'more details here'
    );
    // updatedAt -> updated_at in seconds
    expect(payload.shareableList.updated_at).to.equal(
      Math.floor(newUpdatedAt.getTime() / 1000)
    );

    // SHAREABLE_LIST_UNHIDDEN
    // update some properties
    shareableList.moderationStatus = ModerationStatus.VISIBLE;
    shareableList.restorationReason = 'restoring list';
    shareableList.updatedAt = new Date('2023-02-04 05:15:43');
    newUpdatedAt = shareableList.updatedAt;
    payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_UNHIDDEN,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-hidden
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_UNHIDDEN
    );
    // userId -> user_id
    expect(payload.shareableList.user_id).to.equal(
      parseInt(shareableList.userId as unknown as string)
    );
    // check that moderation_status was updated to VISIBLE
    expect(payload.shareableList.moderation_status).to.equal(
      ModerationStatus.VISIBLE
    );
    // check that restoration_reason exists
    expect(payload.shareableList.restoration_reason).to.equal('restoring list');
    // updatedAt -> updated_at in seconds
    expect(payload.shareableList.updated_at).to.equal(
      Math.floor(newUpdatedAt.getTime() / 1000)
    );

    // Lets mimick a shareable_list_created event with a bad userId
    shareableList.userId = null;
    payload = await generateShareableListEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_CREATED,
      shareableList
    );
    // shareableList obj must not be null
    expect(payload.shareableList).to.not.be.null;
    // check that the payload event type is for shareable-list-created
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_CREATED
    );
    // userId -> user_id should be undefined
    expect(payload.shareableList.user_id).to.equal(undefined);
    // Expect message to get logged in Sentry
    expect(sentryStub.callCount).to.equal(1);
    expect(sentryStub.getCall(0).firstArg).to.equal(
      'Snowplow: Failed to parse userId'
    );
    // set the userId back to a good one
    shareableList.userId = BigInt(12345);
  });

  it('generateShareableListItemEventBridgePayload function', async () => {
    // SHAREABLE_LIST_ITEM_CREATED
    let payload = await generateShareableListItemEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED,
      shareableListItem,
      shareableListItemExternalId,
      shareableList.externalId
    );
    // shareableListItem obj must not be null
    expect(payload.shareableListItem).to.not.be.null;
    // check that the payload event type is for shareable-list-item-created
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED
    );
    // now check that API obj properties have been mapped to the Snowplow obj properties

    // externalId -> shareable_list_item_external_id
    expect(payload.shareableListItem.shareable_list_item_external_id).to.equal(
      shareableListItemExternalId
    );
    // listId -> shareable_list_external_id
    expect(payload.shareableListItem.shareable_list_external_id).to.equal(
      shareableList.externalId
    );
    // url-> given_url
    expect(payload.shareableListItem.given_url).to.equal(shareableListItem.url);

    // imageUrl-> image_url
    expect(payload.shareableListItem.image_url).to.equal(
      shareableListItem.imageUrl
    );
    // authors string getting mapped to array of strings
    expect(JSON.stringify(payload.shareableListItem.authors)).to.equal(
      JSON.stringify(shareableListItem.authors.split(','))
    );
    // publisher
    expect(payload.shareableListItem.publisher).to.equal(
      shareableListItem.publisher
    );
    // note
    expect(payload.shareableListItem.note).to.equal(shareableListItem.note);
    // sortOrder -> sort_order
    expect(payload.shareableListItem.sort_order).to.equal(
      shareableListItem.sortOrder
    );
    // createdAt -> created_at in unix timestamp
    expect(payload.shareableListItem.created_at).to.equal(
      Math.floor(shareableListItem.createdAt.getTime() / 1000)
    );
    // updatedAt -> updated_at in unix timestamp
    expect(payload.shareableListItem.updated_at).to.equal(
      Math.floor(shareableListItem.updatedAt.getTime() / 1000)
    );

    // SHAREABLE_LIST_ITEM_UPDATED
    shareableListItem.note = 'new note updated';
    shareableListItem.sortOrder = 5;
    shareableListItem.updatedAt = new Date('2023-02-05 05:15:43');
    payload = await generateShareableListItemEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_ITEM_UPDATED,
      shareableListItem,
      shareableListItemExternalId,
      shareableList.externalId
    );
    // shareableListItem obj must not be null
    expect(payload.shareableListItem).to.not.be.null;
    // check that the payload event type is for shareable-list-item-updated
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_ITEM_UPDATED
    );
    // now check that note & sortOrder were correctly mapped and updated
    // note
    expect(payload.shareableListItem.note).to.equal('new note updated');
    expect(payload.shareableListItem.sort_order).to.equal(5);
    // updatedAt -> updated_at in unix timestamp
    expect(payload.shareableListItem.updated_at).to.equal(
      Math.floor(shareableListItem.updatedAt.getTime() / 1000)
    );

    // SHAREABLE_LIST_ITEM_DELETED
    payload = await generateShareableListItemEventBridgePayload(
      EventBridgeEventType.SHAREABLE_LIST_ITEM_DELETED,
      shareableListItem,
      shareableListItemExternalId,
      shareableList.externalId
    );
    // shareableList obj must not be null
    expect(payload.shareableListItem).to.not.be.null;
    // check that the payload event type is for shareable-list-item-deleted
    expect(payload.eventType).to.equal(
      EventBridgeEventType.SHAREABLE_LIST_ITEM_DELETED
    );
  });
  describe('sendEventHelper function', () => {
    it('should log error if send call throws error for shareable-list event', async () => {
      eventBridgeClientStub.restore();
      eventBridgeClientStub = sinon
        .stub(EventBridgeClient.prototype, 'send')
        .rejects(new Error('boo!'));

      // pass shareable-list event as example
      await sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_CREATED, {
        shareableList,
        isShareableListEventType: true,
      });

      // Wait just a tad in case promise needs time to resolve
      await setTimeout(() => {
        // nothing to see here
      }, 100);
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg.message).to.contain('boo!');
      expect(crumbStub.callCount).to.equal(1);
      expect(crumbStub.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_created' to event bus`
      );
      expect(loggerErrorSpy.callCount).to.equal(1);
      expect(loggerErrorSpy.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_created' to event bus`
      );
    });
    it('should log error if send call throws error for shareable-list-item event', async () => {
      eventBridgeClientStub.restore();
      eventBridgeClientStub = sinon
        .stub(EventBridgeClient.prototype, 'send')
        .rejects(new Error('boo!'));

      await sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED, {
        shareableListItem,
        shareableListItemExternalId,
        listExternalId: shareableList.externalId,
        isShareableListItemEventType: true,
      });

      // Wait just a tad in case promise needs time to resolve
      await setTimeout(() => {
        // nothing to see here
      }, 100);
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg.message).to.contain('boo!');
      expect(crumbStub.callCount).to.equal(1);
      expect(crumbStub.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_item_created' to event bus`
      );
      expect(loggerErrorSpy.callCount).to.equal(1);
      expect(loggerErrorSpy.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_item_created' to event bus`
      );
    });
  });
  describe('sendEvent function', () => {
    it('should send shareable-list event to event bus with proper event data', async () => {
      // let's first generate a payload to send to the event bridge
      const payload = await generateShareableListEventBridgePayload(
        EventBridgeEventType.SHAREABLE_LIST_CREATED,
        shareableList
      );
      // shareableList obj must not be null
      expect(payload.shareableList).to.not.be.null;
      // send shareable-list event
      await sendEvent(payload, true, false);

      // // Wait just a tad in case promise needs time to resolve
      await setTimeout(() => {
        // nothing to see here
      }, 100);
      expect(sentryStub.callCount).to.equal(0);
      expect(loggerErrorSpy.callCount).to.equal(0);
    });
    it('should send shareable-list-item event to event bus with proper event data', async () => {
      // let's first generate a payload to send to the event bridge
      const payload = await generateShareableListItemEventBridgePayload(
        EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED,
        shareableListItem,
        shareableListItemExternalId,
        shareableList.externalId
      );
      // shareableList obj must not be null
      expect(payload.shareableListItem).to.not.be.null;
      // send shareable-list event
      await sendEvent(payload, false, true);

      // // Wait just a tad in case promise needs time to resolve
      await setTimeout(() => {
        // nothing to see here
      }, 100);
      expect(sentryStub.callCount).to.equal(0);
      expect(loggerErrorSpy.callCount).to.equal(0);
    });
    it('should log error if send call throws error for shareable-list event', async () => {
      eventBridgeClientStub.restore();
      eventBridgeClientStub = sinon
        .stub(EventBridgeClient.prototype, 'send')
        .resolves({ FailedEntryCount: 1 });

      // let's first generate a payload to send to the event bridge
      const payload = await generateShareableListEventBridgePayload(
        EventBridgeEventType.SHAREABLE_LIST_CREATED,
        shareableList
      );
      // shareableList obj must not be null
      expect(payload.shareableList).to.not.be.null;
      // send shareable-list event
      await sendEvent(payload, true, false);

      // // Wait just a tad in case promise needs time to resolve
      await setTimeout(() => {
        // nothing to see here
      }, 100);
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_created' to event bus`
      );
      expect(loggerErrorSpy.callCount).to.equal(1);
      expect(loggerErrorSpy.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_created' to event bus`
      );
    });
    it('should log error if send call throws error for shareable-list-item event', async () => {
      eventBridgeClientStub.restore();
      eventBridgeClientStub = sinon
        .stub(EventBridgeClient.prototype, 'send')
        .resolves({ FailedEntryCount: 1 });

      // let's first generate a payload to send to the event bridge
      const payload = await generateShareableListItemEventBridgePayload(
        EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED,
        shareableListItem,
        shareableListItemExternalId,
        shareableList.externalId
      );
      // shareableListItem obj must not be null
      expect(payload.shareableListItem).to.not.be.null;
      // send shareable-list-item event
      await sendEvent(payload, false, true);

      // // Wait just a tad in case promise needs time to resolve
      await setTimeout(() => {
        // nothing to see here
      }, 100);
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_item_created' to event bus`
      );
      expect(loggerErrorSpy.callCount).to.equal(1);
      expect(loggerErrorSpy.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'shareable_list_item_created' to event bus`
      );
    });
  });
});
