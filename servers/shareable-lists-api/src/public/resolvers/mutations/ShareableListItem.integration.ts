import { expect } from 'chai';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { List, ListItem, ModerationStatus, PrismaClient } from '@prisma/client';
import { startServer } from '../../../express';
import { IPublicContext } from '../../context';
import { client } from '../../../database/client';
import {
  CreateShareableListItemInput,
  UpdateShareableListItemInput,
  UpdateShareableListItemsInput,
} from '../../../database/types';
import {
  CREATE_SHAREABLE_LIST_ITEM,
  UPDATE_SHAREABLE_LIST_ITEM,
  UPDATE_SHAREABLE_LIST_ITEMS,
  DELETE_SHAREABLE_LIST_ITEM,
} from './sample-mutations.gql';
import {
  clearDb,
  createShareableListHelper,
  createShareableListItemHelper,
  mockRedisServer,
} from '../../../test/helpers';
import {
  ACCESS_DENIED_ERROR,
  LIST_ITEM_NOTE_MAX_CHARS,
} from '../../../shared/constants';

describe('public mutations: ShareableListItem', () => {
  let app: Express.Application;
  let server: ApolloServer<IPublicContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let eventBridgeClientStub: sinon.SinonStub;

  let clock;

  // for strong checks on createdAt and updatedAt values
  const arbitraryTimestamp = 1664400000000;
  const oneDay = 86400000;

  const pilotUserHeaders = {
    userId: '8009882300',
  };

  const publicUserHeaders = {
    userId: '123456789',
  };

  const publicUserHeaders2 = {
    userId: '7732025862',
  };

  beforeAll(async () => {
    mockRedisServer();

    // port 0 tells express to dynamically assign an available port
    ({
      app,
      publicServer: server,
      publicUrl: graphQLUrl,
    } = await startServer(0));

    db = client();

    // we mock the send method on EventBridgeClient
    eventBridgeClientStub = sinon
      .stub(EventBridgeClient.prototype, 'send')
      .resolves({ FailedEntryCount: 0 });
  });

  afterAll(async () => {
    eventBridgeClientStub.restore();
    await db.$disconnect();
    await server.stop();
  });

  describe('createShareableListItem', () => {
    let pilotList: List;
    let list: List;

    beforeEach(async () => {
      await clearDb(db);

      // Create a parent Shareable List for pilot & public users
      pilotList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'This List Will Have Lots of Stories',
      });

      list = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'This List Will Have Lots of Stories',
      });
    });

    it("should not create a new item for a list that doesn't exist", async () => {
      const data: CreateShareableListItemInput = {
        listExternalId: 'this-list-does-not-even-exist',
        itemId: '1',
        url: 'https://getpocket.com/discover',
        sortOrder: 1,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be nothing in results
      expect(result.body.data.createShareableListItem).to.be.null;

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
    });

    it('should not create a new item for a list that has been taken down', async () => {
      const hiddenList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'This List Has Been Removed',
        moderationStatus: ModerationStatus.HIDDEN,
      });

      const data: CreateShareableListItemInput = {
        listExternalId: hiddenList.externalId,
        itemId: '1',
        url: 'https://getpocket.com/discover',
        sortOrder: 5,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be nothing in results
      expect(result.body.data.createShareableListItem).to.be.null;

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
    });

    it('should not create a list item in a list that belongs to another user', async () => {
      const data: CreateShareableListItemInput = {
        listExternalId: pilotList.externalId,
        itemId: '1',
        url: 'https://www.test.com/this-is-a-story',
        title: 'This Story Is Trying to Sneak In',
        sortOrder: 20,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set({ userId: publicUserHeaders.userId }) // Note the test list is owned by pilotUser1
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });
      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');
      // There should be nothing in results
      expect(result.body.data.createShareableListItem).to.be.null;

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
    });

    it('should not create a new list item with an invalid itemId', async () => {
      const data: CreateShareableListItemInput = {
        listExternalId: list.externalId,
        itemId: '383asdf4701731',
        url: 'https://www.test.com/this-is-a-story',
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 10,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).to.equal('BAD_USER_INPUT');
      expect(result.body.errors[0].message).to.equal(
        `${data.itemId} is an invalid itemId`
      );
    });

    it('should not create a new list item with note longer than 300 characters', async () => {
      const data: CreateShareableListItemInput = {
        listExternalId: list.externalId,
        itemId: '3834701731',
        url: 'https://www.test.com/this-is-a-story',
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        note: faker.string.alpha(LIST_ITEM_NOTE_MAX_CHARS + 1),
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 10,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      expect(result.body.errors[0].extensions.code).to.equal('BAD_USER_INPUT');
      expect(result.body.errors[0].message).to.contain(
        `Must be no more than ${LIST_ITEM_NOTE_MAX_CHARS} characters in length`
      );
    });

    it('should create a new list item without a note', async () => {
      const data: CreateShareableListItemInput = {
        listExternalId: list.externalId,
        itemId: '3834701731',
        url: 'https://www.test.com/this-is-a-story',
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 10,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.createShareableListItem).not.to.be.null;

      // Assert that all props are returned
      const listItem = result.body.data.createShareableListItem;
      expect(listItem.externalId).not.to.be.empty;
      expect(listItem.itemId).to.equal(data.itemId);
      expect(listItem.url).to.equal(data.url);
      expect(listItem.title).to.equal(data.title);
      expect(listItem.excerpt).to.equal(
        '&lt;blink&gt;The best story ever told&lt;/blink&gt;'
      );
      expect(listItem.note).to.be.null;
      expect(listItem.imageUrl).to.equal(data.imageUrl);
      expect(listItem.publisher).to.equal(data.publisher);
      expect(listItem.authors).to.equal(data.authors);
      expect(listItem.sortOrder).to.equal(data.sortOrder);
      expect(listItem.createdAt).not.to.be.empty;
      expect(listItem.updatedAt).not.to.be.empty;
    });

    it('should create a new list item with all properties', async () => {
      const data: CreateShareableListItemInput = {
        listExternalId: list.externalId,
        itemId: '3834701731',
        url: 'https://www.test.com/this-is-a-story',
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        note: '<div>here is what <strong>i</strong> think about this article...</div>',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 10,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.createShareableListItem).not.to.be.null;

      // Assert that all props are returned
      const listItem = result.body.data.createShareableListItem;

      expect(listItem.externalId).not.to.be.empty;
      expect(listItem.itemId).to.equal(data.itemId);
      expect(listItem.url).to.equal(data.url);
      expect(listItem.title).to.equal(data.title);
      expect(listItem.excerpt).to.equal(
        '&lt;blink&gt;The best story ever told&lt;/blink&gt;'
      );
      expect(listItem.note).to.equal(
        '&lt;div&gt;here is what &lt;strong&gt;i&lt;/strong&gt; think about this article...&lt;/div&gt;'
      );
      expect(listItem.imageUrl).to.equal(data.imageUrl);
      expect(listItem.publisher).to.equal(data.publisher);
      expect(listItem.authors).to.equal(data.authors);
      expect(listItem.sortOrder).to.equal(data.sortOrder);
      expect(listItem.createdAt).not.to.be.empty;
      expect(listItem.updatedAt).not.to.be.empty;
    });

    it('should not create a list item with the same URL in the same list', async () => {
      // Simulate a pre-existing item with the same URL by adding it straight
      // to the database
      await createShareableListItemHelper(db, {
        list: list,
        url: 'https://www.test.com/duplicate-url',
      });

      const data: CreateShareableListItemInput = {
        listExternalId: list.externalId,
        itemId: '1',
        url: 'https://www.test.com/duplicate-url',
        sortOrder: 5,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be nothing in results
      expect(result.body.data.createShareableListItem).to.be.null;

      // And a "Bad user input" error
      expect(result.body.errors[0].extensions.code).to.equal('BAD_USER_INPUT');
    });

    it('should create a list item with the same URL in a different list', async () => {
      // Create another list
      const list2 = await createShareableListHelper(db, {
        title: 'Another List By The Same User',
        userId: parseInt(publicUserHeaders.userId),
      });

      // Simulate a pre-existing item with the same URL by adding it straight
      // to the database
      await createShareableListItemHelper(db, {
        list: list2,
        url: 'https://www.test.com/duplicate-url',
      });

      const data: CreateShareableListItemInput = {
        listExternalId: list.externalId,
        itemId: '3789538749',
        url: 'https://www.test.com/another-duplicate-url',
        title: 'A story is a story',
        excerpt: 'The best story ever told',
        note: 'here is what i think about this article...',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The Hogwarts Express',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 5,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });
      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');
      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.createShareableListItem).not.to.be.null;

      // Assert that all props are returned
      const listItem = result.body.data.createShareableListItem;
      expect(listItem.externalId).not.to.be.empty;
      expect(listItem.itemId).to.equal(data.itemId);
      expect(listItem.url).to.equal(data.url);
      expect(listItem.title).to.equal(data.title);
      expect(listItem.excerpt).to.equal(data.excerpt);
      expect(listItem.note).to.equal(data.note);
      expect(listItem.imageUrl).to.equal(data.imageUrl);
      expect(listItem.publisher).to.equal(data.publisher);
      expect(listItem.authors).to.equal(data.authors);
      expect(listItem.sortOrder).to.equal(data.sortOrder);
      expect(listItem.createdAt).not.to.be.empty;
      expect(listItem.updatedAt).not.to.be.empty;
    });

    it('should update the updatedAt value of the parent list', async () => {
      // stub the clock so we can directly check updatedAt
      clock = sinon.useFakeTimers({
        now: arbitraryTimestamp,
        shouldAdvanceTime: false,
      });

      // advance the clock one day
      clock.tick(oneDay);

      const data: CreateShareableListItemInput = {
        listExternalId: list.externalId,
        itemId: '3834701731',
        url: 'https://www.test.com/this-is-a-story',
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 10,
      };

      await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      const updatedList = await db.list.findFirst({
        where: {
          externalId: list.externalId,
        },
      });

      expect(updatedList.updatedAt.getTime()).to.equal(
        arbitraryTimestamp + oneDay
      );

      clock.restore();
    });
  });

  describe('updateShareableListItem', () => {
    let shareableList1: List;
    let shareableList2: List;
    let listItem1: ListItem;
    let listItem2: ListItem;

    beforeEach(async () => {
      await clearDb(db);

      // Create a VISIBLE List for pilot user 1
      shareableList1 = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'Simon Le Bon List',
      });

      // Create a ListItem
      listItem1 = await createShareableListItemHelper(db, {
        list: shareableList1,
      });

      // Create a VISIBLE List for public user
      shareableList2 = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'Aux Merveilleux de Fred',
      });

      // Create a ListItem
      listItem2 = await createShareableListItemHelper(db, {
        list: shareableList2,
      });
    });

    it('should update a shareable list item', async () => {
      const data: UpdateShareableListItemInput = {
        externalId: listItem2.externalId,
        note: '<strong>new</strong> note!',
        sortOrder: 3,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.to.be.null;

      const listItem = result.body.data.updateShareableListItem;

      // the properties should be updated
      expect(listItem.note).to.equal('&lt;strong&gt;new&lt;/strong&gt; note!');
      expect(listItem.sortOrder).to.equal(data.sortOrder);
    });

    it('should update the updatedAt value of the item and the parent list', async () => {
      // stub the clock so we can directly check createdAt and updatedAt
      clock = sinon.useFakeTimers({
        now: arbitraryTimestamp,
        shouldAdvanceTime: false,
      });

      // advance the clock one day to mimic an update made a day after create
      clock.tick(oneDay);

      const data: UpdateShareableListItemInput = {
        externalId: listItem1.externalId,
        sortOrder: 3,
      };

      // do some kind of sleep

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      expect(
        Date.parse(result.body.data.updateShareableListItem.updatedAt)
      ).to.equal(arbitraryTimestamp + oneDay);

      const list = await db.list.findFirst({
        where: {
          externalId: shareableList1.externalId,
        },
      });

      expect(list.updatedAt.getTime()).to.equal(arbitraryTimestamp + oneDay);

      clock.restore();
    });

    it('should not update a shareable list item with a note greater than 300 characters', async () => {
      const data: UpdateShareableListItemInput = {
        externalId: listItem1.externalId,
        note: faker.string.alpha(LIST_ITEM_NOTE_MAX_CHARS + 1),
        sortOrder: 3,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      expect(result.body.errors[0].extensions.code).to.equal('BAD_USER_INPUT');
      expect(result.body.errors[0].message).to.contain(
        `Must be no more than ${LIST_ITEM_NOTE_MAX_CHARS} characters in length`
      );
    });

    it('should not update a shareable list item for an invalid external id', async () => {
      // list item 2 does not belong to the default user in the headers
      const data: UpdateShareableListItemInput = {
        externalId: 'totallyInvalidId',
        note: 'test',
        sortOrder: 3,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.contain(
        'Error - Not Found: A list item by that ID could not be found'
      );
    });

    it('should not update a shareable list item for a different user', async () => {
      // list item 2 does not belong to the default user in the headers
      const data: UpdateShareableListItemInput = {
        externalId: listItem2.externalId,
        note: 'test',
        sortOrder: 3,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set({
          userId: '5555555555',
        })
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.contain(
        'Error - Not Found: A list item by that ID could not be found'
      );
    });

    it('should update a shareable list item and delete a note', async () => {
      const data: UpdateShareableListItemInput = {
        externalId: listItem2.externalId,
        note: null,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.to.be.null;

      const listItem = result.body.data.updateShareableListItem;

      // note should be gone
      expect(listItem.note).to.be.null;

      // sort order should be unchanged
      expect(listItem.sortOrder).to.equal(listItem1.sortOrder);
    });

    it('should update a shareable list item sort order', async () => {
      const data: UpdateShareableListItemInput = {
        externalId: listItem2.externalId,
        sortOrder: 4,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.to.be.null;

      const listItem = result.body.data.updateShareableListItem;

      // sort order should be updated
      expect(listItem.sortOrder).to.equal(data.sortOrder);

      // note should be retained
      expect(listItem.note).to.equal(listItem2.note);
    });

    it('should disregard a sort order of null', async () => {
      const data: UpdateShareableListItemInput = {
        externalId: listItem2.externalId,
        sortOrder: null,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.to.be.null;

      const listItem = result.body.data.updateShareableListItem;

      // sort order should be updated
      expect(listItem.sortOrder).to.equal(listItem1.sortOrder);
    });
  });

  describe('updateShareableListItems', () => {
    let shareableList1User1: List;
    let shareableList2User1: List;
    let shareableList1User2: List;
    let shareableList1User1_item1: ListItem;
    let shareableList1User1_item2: ListItem;
    let shareableList2User1_item1: ListItem;
    let shareableList1User2_item1: ListItem;

    beforeEach(async () => {
      await clearDb(db);

      // create lists for public user 1
      shareableList1User1 = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'Simon Le Bon List',
      });

      shareableList2User1 = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'Nick Rhodes List',
      });

      // create list items
      shareableList1User1_item1 = await createShareableListItemHelper(db, {
        list: shareableList1User1,
      });

      shareableList1User1_item2 = await createShareableListItemHelper(db, {
        list: shareableList1User1,
      });

      shareableList2User1_item1 = await createShareableListItemHelper(db, {
        list: shareableList2User1,
      });

      // create a list for public user 2
      shareableList1User2 = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders2.userId),
        title: 'Aux Merveilleux de Fred',
      });

      // create list items
      shareableList1User2_item1 = await createShareableListItemHelper(db, {
        list: shareableList1User2,
      });
    });

    it('should update sortOrders of an array of shareable list items', async () => {
      const data: UpdateShareableListItemsInput[] = [
        {
          externalId: shareableList1User1_item1.externalId,
          sortOrder: 1,
        },
        {
          externalId: shareableList1User1_item2.externalId,
          sortOrder: 2,
        },
      ];

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEMS),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.updateShareableListItems).not.to.be.null;

      const listItems = result.body.data.updateShareableListItems;
      // the sortOrders should be updated
      expect(listItems[0].sortOrder).to.equal(data[0].sortOrder);
      expect(listItems[1].sortOrder).to.equal(data[1].sortOrder);
    });

    it('should update the updatedAt value for each shareable list item', async () => {
      // stub the clock so we can directly check updatedAt
      clock = sinon.useFakeTimers({
        now: arbitraryTimestamp,
        shouldAdvanceTime: false,
      });

      // advance the clock one day to mimic an update made a day after create
      clock.tick(oneDay);

      const data: UpdateShareableListItemsInput[] = [
        {
          externalId: shareableList1User1_item1.externalId,
          sortOrder: 1,
        },
        {
          externalId: shareableList1User1_item2.externalId,
          sortOrder: 2,
        },
      ];

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEMS),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.updateShareableListItems).not.to.be.null;

      const listItems = result.body.data.updateShareableListItems;

      expect(Date.parse(listItems[0].updatedAt)).to.equal(
        arbitraryTimestamp + oneDay
      );

      expect(Date.parse(listItems[1].updatedAt)).to.equal(
        arbitraryTimestamp + oneDay
      );

      clock.restore();
    });

    it('should update the updatedAt value for each parent list', async () => {
      // stub the clock so we can directly check createdAt and updatedAt
      clock = sinon.useFakeTimers({
        now: arbitraryTimestamp,
        shouldAdvanceTime: false,
      });

      // advance the clock one day to mimic an update made a day after create
      clock.tick(oneDay);

      const data: UpdateShareableListItemsInput[] = [
        {
          externalId: shareableList1User1_item1.externalId,
          sortOrder: 1,
        },
        {
          externalId: shareableList1User1_item2.externalId,
          sortOrder: 2,
        },
        // a list item from a different list! will this ever happen in
        // practice? unclear. but it could, so we should test it.
        {
          externalId: shareableList2User1_item1.externalId,
          sortOrder: 15,
        },
      ];

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEMS),
          variables: { data },
        });

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // A result should be returned
      expect(result.body.data.updateShareableListItems).not.to.be.null;

      // retrieve the paret lists that should have been updated
      const updatedLists = await db.list.findMany({
        where: {
          externalId: {
            in: [
              shareableList1User1.externalId,
              shareableList2User1.externalId,
            ],
          },
        },
      });

      expect(updatedLists[0].updatedAt.getTime()).to.equal(
        arbitraryTimestamp + oneDay
      );

      expect(updatedLists[1].updatedAt.getTime()).to.equal(
        arbitraryTimestamp + oneDay
      );

      clock.restore();
    });

    it('should fail the entire update call if one of the externalIds is invalid', async () => {
      const data: UpdateShareableListItemsInput[] = [
        {
          externalId: shareableList1User1_item1.externalId, // valid
          sortOrder: 1,
        },
        {
          externalId: 'totallyInvalidId', // the fake id
          sortOrder: 2,
        },
      ];

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEMS),
          variables: { data },
        });

      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.contain(
        'Error - Not Found: A list item by that ID could not be found'
      );
      // lets make sure the valid list item was not updated
      const validListItem = await db.listItem.findFirst({
        where: { externalId: shareableList1User1_item1.externalId },
      });
      // expect the list item sortOrder not be updated to 1
      expect(validListItem.sortOrder).not.to.equal(1);
      // double check sortOrder is original value
      expect(validListItem.sortOrder).to.equal(
        shareableList1User1_item1.sortOrder
      );
    });

    it('should fail if more than 30 list items are provided as input', async () => {
      // lets create 31 list items for List 1
      const externalIds = [];
      const sortOrders = [];
      let listItem;
      const data: UpdateShareableListItemsInput[] = [];
      for (let i = 0; i < 31; i++) {
        listItem = await createShareableListItemHelper(db, {
          list: shareableList1User1,
        });
        externalIds.push(listItem.externalId);
        sortOrders.push(i);
      }

      // create the input of 31 list items
      for (let i = 0; i < externalIds.length; i++) {
        data.push({
          externalId: externalIds[i],
          sortOrder: sortOrders[i],
        });
      }

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEMS),
          variables: { data },
        });

      expect(result.body.errors[0].extensions.code).to.equal('BAD_USER_INPUT');
      expect(result.body.errors[0].message).to.contain(
        `Variable "$data" at "data" must be no more than 30 in length`
      );
    });

    it('should fail the entire update call if one of the shareable list item is for a different user', async () => {
      const data: UpdateShareableListItemsInput[] = [
        {
          externalId: shareableList1User1_item1.externalId, // valid
          sortOrder: 1,
        },
        {
          externalId: shareableList1User2_item1.externalId, // listItem3 belongs to pilotUser 2
          sortOrder: 2,
        },
      ];

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEMS),
          variables: { data },
        });

      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.contain(
        'Error - Not Found: A list item by that ID could not be found'
      );
    });
  });

  describe('deleteShareableListItem', () => {
    let shareableList: List;
    let listItem1: ListItem;

    beforeEach(async () => {
      await clearDb(db);

      // Create a VISIBLE List
      shareableList = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'Simon Le Bon List',
      });

      // Create a ListItem
      listItem1 = await createShareableListItemHelper(db, {
        list: shareableList,
      });
    });

    it('should not delete a list item for another userId', async () => {
      // Create a List and ListItem for another userId
      const list = await createShareableListHelper(db, {
        userId: 5555555555,
        title: 'Bob Sinclair List',
      });

      const listItem = await createShareableListItemHelper(db, {
        list,
      });

      // Run the mutation as userId: 12345 but trying to delete a list item for userId: 65129
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST_ITEM),
          variables: { externalId: listItem.externalId },
        });
      expect(result.body.data).not.to.exist;
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.equal(
        'Error - Not Found: A list item by that ID could not be found'
      );
    });

    it('should not delete a list item without userId in header', async () => {
      // Run the mutation with no userId in the header
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(DELETE_SHAREABLE_LIST_ITEM),
          variables: { externalId: listItem1.externalId },
        });
      expect(result.body.data).not.to.exist;
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
    });

    it('should not delete a list item if no list item was found', async () => {
      // Run the mutation with a non-existing externalId
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST_ITEM),
          variables: { externalId: 'non-existing-uuid' },
        });
      expect(result.body.data).not.to.exist;
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.equal(
        'Error - Not Found: A list item by that ID could not be found'
      );
    });

    it('should not delete a list item if parent list is hidden', async () => {
      // this function should operate on pilot users as right now, only a
      // pilot user can publish a list (which can be hidden)
      // Create a HIDDEN List
      const hiddenShareableList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'Simon Le Bon List',
        moderationStatus: ModerationStatus.HIDDEN,
      });
      // Create an item for the hidden list
      const listItem3 = await createShareableListItemHelper(db, {
        list: hiddenShareableList,
      });
      // Run the mutation
      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST_ITEM),
          variables: { externalId: listItem3.externalId },
        });
      expect(result.body.data).not.to.exist;
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.equal(
        'Error - Not Found: A list item by that ID could not be found'
      );
    });

    it('should successfully delete a list item', async () => {
      // Run the mutation
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST_ITEM),
          variables: { externalId: listItem1.externalId },
        });
      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');
      expect(result.body.data.deleteShareableListItem).to.exist;
      expect(result.body.data.deleteShareableListItem.title).to.equal(
        listItem1.title
      );
      // Assert that the item is not present in the db anymore
      // by trying to delete the same item
      const result2 = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST_ITEM),
          variables: { externalId: listItem1.externalId },
        });
      expect(result2.body.data).not.to.exist;
      expect(result2.body.errors.length).to.equal(1);
      expect(result2.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result2.body.errors[0].message).to.equal(
        'Error - Not Found: A list item by that ID could not be found'
      );
    });

    it('should update the parent list updatedAt value when deleting a list item', async () => {
      // stub the clock so we can directly check updatedAt
      clock = sinon.useFakeTimers({
        now: arbitraryTimestamp,
        shouldAdvanceTime: false,
      });

      // advance the clock one day to mimic an update made a day after create
      clock.tick(oneDay);

      // run the mutation
      await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST_ITEM),
          variables: { externalId: listItem1.externalId },
        });

      // retrieve the parent list of the item updated
      const list = await db.list.findFirst({
        where: {
          externalId: shareableList.externalId,
        },
      });

      expect(list.updatedAt.getTime()).to.equal(arbitraryTimestamp + oneDay);

      clock.restore();
    });
  });
});
