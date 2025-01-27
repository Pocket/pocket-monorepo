import { faker } from '@faker-js/faker';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import { List, ListItem, ModerationStatus, PrismaClient } from '.prisma/client';
import { startServer } from '../../../express';
import { IPublicContext } from '../../context';
import { client, conn } from '../../../database/client';
import {
  AddItemInput,
  CreateShareableListItemInput,
  UpdateShareableListItemInput,
  UpdateShareableListItemsInput,
} from '../../../database/types';
import {
  CREATE_SHAREABLE_LIST_ITEM,
  UPDATE_SHAREABLE_LIST_ITEM,
  UPDATE_SHAREABLE_LIST_ITEMS,
  DELETE_SHAREABLE_LIST_ITEM,
  ADD_TO_SHAREABLE_LIST,
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
import { Application } from 'express';
import { IAdminContext } from '../../../admin/context';
import { Kysely } from 'kysely';
import { DB } from '.kysely/client/types';

describe('public mutations: ShareableListItem', () => {
  let app: Application;
  let server: ApolloServer<IPublicContext>;
  let adminServer: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let con: Kysely<DB>;

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
      adminServer: adminServer,
      publicUrl: graphQLUrl,
    } = await startServer(0));

    db = client();
    con = conn();

    // we mock the send method on EventBridgeClient
    jest
      .spyOn(PocketEventBridgeClient.prototype, 'sendPocketEvent')
      .mockClear()
      .mockImplementation(() => Promise.resolve());
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    await db.$disconnect();
    await server.stop();
    await adminServer.stop();
    await con.destroy();
  });

  describe('addToShareableList', () => {
    let list: List;

    const itemBase = {
      title: 'A story is a story',
      excerpt: '<blink>The best story ever told</blink>',
      imageUrl: 'https://www.test.com/thumbnail.jpg',
      publisher: 'The London Times',
      authors: 'Charles Dickens, Mark Twain',
    };

    afterAll(() => jest.useRealTimers());

    beforeEach(async () => {
      await clearDb(db);
      jest.useFakeTimers({
        now: arbitraryTimestamp,
        advanceTimers: false,
        // If these are faked, prisma transactions hang
        doNotFake: ['nextTick', 'setImmediate'],
      });

      list = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'This List Will Have Lots of Stories',
      });
    });

    it('adds one item to a shareable list', async () => {
      const variables: { listExternalId: string; items: AddItemInput[] } = {
        listExternalId: list.externalId,
        items: [
          {
            ...itemBase,
            itemId: '3834701731',
            url: 'https://www.test.com/this-is-a-story',
          },
        ],
      };

      const expected = {
        addToShareableList: expect.objectContaining({
          updatedAt: new Date(arbitraryTimestamp).toISOString(),
          externalId: list.externalId,
          listItems: [expect.objectContaining(variables.items[0])],
        }),
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(ADD_TO_SHAREABLE_LIST),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data).toEqual(expected);
    });
    it('adds more than one item to a shareable list', async () => {
      const variables: { listExternalId: string; items: AddItemInput[] } = {
        listExternalId: list.externalId,
        items: [
          {
            ...itemBase,
            itemId: '3834701731',
            url: 'https://www.test.com/this-is-a-story',
          },
          {
            ...itemBase,
            itemId: '12345',
            url: 'https://www.test.com/another-story',
          },
        ],
      };

      const expected = {
        addToShareableList: expect.objectContaining({
          updatedAt: new Date(arbitraryTimestamp).toISOString(),
          externalId: list.externalId,
          listItems: [
            expect.objectContaining(variables.items[0]),
            expect.objectContaining(variables.items[1]),
          ],
        }),
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(ADD_TO_SHAREABLE_LIST),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data).toEqual(expected);
    });
    // I can't get this to fail just with bad data -- probably we need strict SQL mode
    it.skip('fails the entire batch if one fails', async () => {
      const variables: { listExternalId: string; items: AddItemInput[] } = {
        listExternalId: list.externalId,
        items: [
          {
            ...itemBase,
            itemId: '3834701731',
            url: 'https://www.test.com/this-is-a-story',
          },
          {
            ...itemBase,
            itemId: '-2000000000000000000000000000000000000000000000000000000',
            url: 'https://www.test.com/this-should-fail',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(ADD_TO_SHAREABLE_LIST),
          variables,
        });
      expect(res.body.errors).not.toBeUndefined();
    });
    it('sends events for each update', async () => {});
    it('throws NotFoundError if the list does not exist', async () => {
      const variables: { listExternalId: string; items: AddItemInput[] } = {
        listExternalId: 'this-fake-uuid-is-unconvincing',
        items: [
          {
            ...itemBase,
            itemId: '3834701731',
            url: 'https://www.test.com/this-is-a-story',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(ADD_TO_SHAREABLE_LIST),
          variables,
        });
      expect(res.body.errors).not.toBeUndefined();
    });
    it('does nothing with duplicated items (already in list)', async () => {
      const withinNSecondsOf = (date: Date, n: number) => (ts: string) =>
        Math.abs(new Date(ts).getTime() / 1000 - date.getTime() / 1000) <= n;
      jest.useRealTimers();
      const now = new Date();
      const past = new Date(1394104654000);
      await createShareableListItemHelper(db, {
        list,
        itemId: 12345,
        url: 'https://www.test.com/another-story',
        sortOrder: 19,
        createdAt: past,
        updatedAt: past,
      });
      const variables: { listExternalId: string; items: AddItemInput[] } = {
        listExternalId: list.externalId,
        items: [
          {
            ...itemBase,
            itemId: '3834701731',
            url: 'https://www.test.com/this-is-a-story',
          },
          {
            ...itemBase,
            itemId: '12345',
            url: 'https://www.test.com/another-story',
          },
        ],
      };
      const expected = {
        addToShareableList: expect.objectContaining({
          externalId: list.externalId,
          listItems: [
            expect.objectContaining({
              itemId: '12345',
              createdAt: past.toISOString(),
              updatedAt: past.toISOString(),
            }),
            expect.objectContaining({
              itemId: '3834701731',
              createdAt: expect.toSatisfy(withinNSecondsOf(now, 1)),
              updatedAt: expect.toSatisfy(withinNSecondsOf(now, 1)),
            }),
          ],
        }),
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(ADD_TO_SHAREABLE_LIST),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data).toEqual(expected);
    });
    it('sets sort order as the order of the input array, for empty list', async () => {
      const variables: { listExternalId: string; items: AddItemInput[] } = {
        listExternalId: list.externalId,
        items: [
          {
            ...itemBase,
            itemId: '3834701731',
            url: 'https://www.test.com/this-is-a-story',
          },
          {
            ...itemBase,
            itemId: '12345',
            url: 'https://www.test.com/another-story',
          },
          {
            ...itemBase,
            itemId: '5678',
            url: 'https://www.test.com/one-more-story',
          },
        ],
      };

      const expected = {
        addToShareableList: expect.objectContaining({
          externalId: list.externalId,
          listItems: [
            expect.objectContaining({ ...variables.items[0], sortOrder: 0 }),
            expect.objectContaining({ ...variables.items[1], sortOrder: 1 }),
            expect.objectContaining({ ...variables.items[2], sortOrder: 2 }),
          ],
        }),
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(ADD_TO_SHAREABLE_LIST),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data).toEqual(expected);
    });
    it('starts the sort order based on the highest extant sort order, for list containing items', async () => {
      await createShareableListItemHelper(db, {
        list,
        itemId: 999,
        url: 'http://some-url.com/that',
        sortOrder: 23,
      });
      await createShareableListItemHelper(db, {
        list,
        itemId: 777,
        url: 'http://another-url.com/this',
        sortOrder: 90,
      });
      const variables: { listExternalId: string; items: AddItemInput[] } = {
        listExternalId: list.externalId,
        items: [
          {
            ...itemBase,
            itemId: '3834701731',
            url: 'https://www.test.com/this-is-a-story',
          },
          {
            ...itemBase,
            itemId: '12345',
            url: 'https://www.test.com/another-story',
          },
        ],
      };
      const expected = {
        addToShareableList: expect.objectContaining({
          updatedAt: new Date(arbitraryTimestamp).toISOString(),
          externalId: list.externalId,
          listItems: expect.toIncludeAllMembers([
            expect.objectContaining({ ...variables.items[0], sortOrder: 91 }),
            expect.objectContaining({ ...variables.items[1], sortOrder: 92 }),
          ]),
        }),
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(ADD_TO_SHAREABLE_LIST),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data).toEqual(expected);
    });
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
      expect(result.body.data.createShareableListItem).toBeNull();

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
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
      expect(result.body.data.createShareableListItem).toBeNull();

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
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
      expect(result.headers['cache-control']).toBe('no-store');
      // There should be nothing in results
      expect(result.body.data.createShareableListItem).toBeNull();

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
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
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toBe(
        `${data.itemId} is an invalid itemId`,
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

      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toContain(
        `Must be no more than ${LIST_ITEM_NOTE_MAX_CHARS} characters in length`,
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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.createShareableListItem).not.toBeNull();

      // Assert that all props are returned
      const listItem = result.body.data.createShareableListItem;
      expect(listItem.externalId).not.toHaveLength(0);
      expect(listItem.itemId).toBe(data.itemId);
      expect(listItem.url).toBe(data.url);
      expect(listItem.title).toBe(data.title);
      expect(listItem.excerpt).toBe(
        '&lt;blink&gt;The best story ever told&lt;/blink&gt;',
      );
      expect(listItem.note).toBeNull();
      expect(listItem.imageUrl).toBe(data.imageUrl);
      expect(listItem.publisher).toBe(data.publisher);
      expect(listItem.authors).toBe(data.authors);
      expect(listItem.sortOrder).toBe(data.sortOrder);
      expect(listItem.createdAt).not.toHaveLength(0);
      expect(listItem.updatedAt).not.toHaveLength(0);
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
      expect(result.headers['cache-control']).toBe('no-store');

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.createShareableListItem).not.toBeNull();

      // Assert that all props are returned
      const listItem = result.body.data.createShareableListItem;

      expect(listItem.externalId).not.toHaveLength(0);
      expect(listItem.itemId).toBe(data.itemId);
      expect(listItem.url).toBe(data.url);
      expect(listItem.title).toBe(data.title);
      expect(listItem.excerpt).toBe(
        '&lt;blink&gt;The best story ever told&lt;/blink&gt;',
      );
      expect(listItem.note).toBe(
        '&lt;div&gt;here is what &lt;strong&gt;i&lt;/strong&gt; think about this article...&lt;/div&gt;',
      );
      expect(listItem.imageUrl).toBe(data.imageUrl);
      expect(listItem.publisher).toBe(data.publisher);
      expect(listItem.authors).toBe(data.authors);
      expect(listItem.sortOrder).toBe(data.sortOrder);
      expect(listItem.createdAt).not.toHaveLength(0);
      expect(listItem.updatedAt).not.toHaveLength(0);
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
      expect(result.body.data.createShareableListItem).toBeNull();

      // And a "Bad user input" error
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
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
      expect(result.headers['cache-control']).toBe('no-store');
      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.createShareableListItem).not.toBeNull();

      // Assert that all props are returned
      const listItem = result.body.data.createShareableListItem;
      expect(listItem.externalId).not.toHaveLength(0);
      expect(listItem.itemId).toBe(data.itemId);
      expect(listItem.url).toBe(data.url);
      expect(listItem.title).toBe(data.title);
      expect(listItem.excerpt).toBe(data.excerpt);
      expect(listItem.note).toBe(data.note);
      expect(listItem.imageUrl).toBe(data.imageUrl);
      expect(listItem.publisher).toBe(data.publisher);
      expect(listItem.authors).toBe(data.authors);
      expect(listItem.sortOrder).toBe(data.sortOrder);
      expect(listItem.createdAt).not.toHaveLength(0);
      expect(listItem.updatedAt).not.toHaveLength(0);
    });

    it('should update the updatedAt value of the parent list', async () => {
      // stub the clock so we can directly check updatedAt
      jest.useFakeTimers({
        now: arbitraryTimestamp + oneDay,
        advanceTimers: false,
        // If these are faked, prisma transactions hang
        doNotFake: ['nextTick', 'setImmediate'],
      });

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

      expect(updatedList.updatedAt.getTime()).toBe(arbitraryTimestamp + oneDay);

      jest.useRealTimers();
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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.toBeNull();

      const listItem = result.body.data.updateShareableListItem;

      // the properties should be updated
      expect(listItem.note).toBe('&lt;strong&gt;new&lt;/strong&gt; note!');
      expect(listItem.sortOrder).toBe(data.sortOrder);
    });

    it('should update the updatedAt value of the item and the parent list', async () => {
      // stub the clock so we can directly check createdAt and updatedAt
      jest.useFakeTimers({
        now: arbitraryTimestamp + oneDay,
        advanceTimers: false,
        doNotFake: ['nextTick', 'setImmediate'],
      });

      const data: UpdateShareableListItemInput = {
        externalId: listItem1.externalId,
        sortOrder: 3,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST_ITEM),
          variables: { data },
        });

      expect(
        Date.parse(result.body.data.updateShareableListItem.updatedAt),
      ).toBe(arbitraryTimestamp + oneDay);

      const list = await db.list.findFirst({
        where: {
          externalId: shareableList1.externalId,
        },
      });

      expect(list.updatedAt.getTime()).toBe(arbitraryTimestamp + oneDay);

      jest.useRealTimers();
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

      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toContain(
        `Must be no more than ${LIST_ITEM_NOTE_MAX_CHARS} characters in length`,
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

      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toContain(
        'Error - Not Found: A list item by that ID could not be found',
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

      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toContain(
        'Error - Not Found: A list item by that ID could not be found',
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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.toBeNull();

      const listItem = result.body.data.updateShareableListItem;

      // note should be gone
      expect(listItem.note).toBeNull();

      // sort order should be unchanged
      expect(listItem.sortOrder).toBe(listItem1.sortOrder);
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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.toBeNull();

      const listItem = result.body.data.updateShareableListItem;

      // sort order should be updated
      expect(listItem.sortOrder).toBe(data.sortOrder);

      // note should be retained
      expect(listItem.note).toBe(listItem2.note);
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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableListItem).not.toBeNull();

      const listItem = result.body.data.updateShareableListItem;

      // sort order should be updated
      expect(listItem.sortOrder).toBe(listItem1.sortOrder);
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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableListItems).not.toBeNull();

      const listItems = result.body.data.updateShareableListItems;
      // the sortOrders should be updated
      expect(listItems[0].sortOrder).toBe(data[0].sortOrder);
      expect(listItems[1].sortOrder).toBe(data[1].sortOrder);
    });

    it('should update the updatedAt value for each shareable list item', async () => {
      // stub the clock so we can directly check updatedAt
      jest.useFakeTimers({
        now: arbitraryTimestamp + oneDay,
        advanceTimers: false,
        doNotFake: ['nextTick', 'setImmediate'],
      });

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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableListItems).not.toBeNull();

      const listItems = result.body.data.updateShareableListItems;

      expect(Date.parse(listItems[0].updatedAt)).toBe(
        arbitraryTimestamp + oneDay,
      );

      expect(Date.parse(listItems[1].updatedAt)).toBe(
        arbitraryTimestamp + oneDay,
      );

      jest.useRealTimers();
    });

    it('should update the updatedAt value for each parent list', async () => {
      // stub the clock so we can directly check createdAt and updatedAt
      jest.useFakeTimers({
        now: arbitraryTimestamp + oneDay,
        advanceTimers: false,
        doNotFake: ['nextTick', 'setImmediate'],
      });

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
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableListItems).not.toBeNull();

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

      expect(updatedLists[0].updatedAt.getTime()).toBe(
        arbitraryTimestamp + oneDay,
      );

      expect(updatedLists[1].updatedAt.getTime()).toBe(
        arbitraryTimestamp + oneDay,
      );

      jest.useRealTimers();
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

      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toContain(
        'Error - Not Found: A list item by that ID could not be found',
      );
      // lets make sure the valid list item was not updated
      const validListItem = await db.listItem.findFirst({
        where: { externalId: shareableList1User1_item1.externalId },
      });
      // expect the list item sortOrder not be updated to 1
      expect(validListItem.sortOrder).not.toBe(1);
      // double check sortOrder is original value
      expect(validListItem.sortOrder).toBe(shareableList1User1_item1.sortOrder);
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

      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toContain(
        `Variable "$data" at "data" must be no more than 30 in length`,
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

      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toContain(
        'Error - Not Found: A list item by that ID could not be found',
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
      expect(result.body.data).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toBe(
        'Error - Not Found: A list item by that ID could not be found',
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
      expect(result.body.data).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('FORBIDDEN');
      expect(result.body.errors[0].message).toBe(ACCESS_DENIED_ERROR);
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
      expect(result.body.data).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toBe(
        'Error - Not Found: A list item by that ID could not be found',
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
      expect(result.body.data).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toBe(
        'Error - Not Found: A list item by that ID could not be found',
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
      expect(result.headers['cache-control']).toBe('no-store');
      expect(result.body.data.deleteShareableListItem).toBeDefined();
      expect(result.body.data.deleteShareableListItem.title).toBe(
        listItem1.title,
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
      expect(result2.body.data).toBeFalsy();
      expect(result2.body.errors.length).toBe(1);
      expect(result2.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result2.body.errors[0].message).toBe(
        'Error - Not Found: A list item by that ID could not be found',
      );
    });

    it('should update the parent list updatedAt value when deleting a list item', async () => {
      // stub the clock so we can directly check updatedAt
      jest.useFakeTimers({
        now: arbitraryTimestamp + oneDay,
        advanceTimers: false,
        doNotFake: ['nextTick', 'setImmediate'],
      });

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

      expect(list.updatedAt.getTime()).toBe(arbitraryTimestamp + oneDay);

      jest.useRealTimers();
    });
  });
});
