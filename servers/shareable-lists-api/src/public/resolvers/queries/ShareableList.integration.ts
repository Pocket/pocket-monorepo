import { print } from 'graphql';
import request from 'supertest';

import { ApolloServer } from '@apollo/server';
import {
  List,
  Visibility,
  ModerationStatus,
  PrismaClient,
} from '@prisma/client';

import { IPublicContext } from '../../context';
import { startServer } from '../../../express';
import { client } from '../../../database/client';
import {
  clearDb,
  createPilotUserHelper,
  createShareableListHelper,
  createShareableListItemHelper,
  mockRedisServer,
} from '../../../test/helpers';
import {
  GET_SHAREABLE_LIST,
  GET_SHAREABLE_LIST_PUBLIC,
  GET_SHAREABLE_LISTS,
} from './sample-queries.gql';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

const toBeNonEmptyString = (s: unknown) =>
  (typeof s === 'string' || s instanceof String) && s.length > 0;

describe('public queries: ShareableList', () => {
  let app: Express.Application;
  let server: ApolloServer<IPublicContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let shareableList: List;
  let shareableList2: List;

  // Commonly reused matcher in these tests for list items
  const basicListItemMatcher = {
    itemId: expect.toSatisfy(toBeNonEmptyString),
    url: expect.toSatisfy(toBeNonEmptyString),
    title: expect.toSatisfy(toBeNonEmptyString),
    excerpt: expect.toSatisfy(toBeNonEmptyString),
    imageUrl: expect.toSatisfy(toBeNonEmptyString),
    publisher: expect.toSatisfy(toBeNonEmptyString),
    authors: expect.toSatisfy(toBeNonEmptyString),
    sortOrder: expect.toBeNumber(),
    createdAt: expect.toBeDateString(),
    updatedAt: expect.toBeDateString(),
  };

  // pilot user is required for public lists
  const pilotUserHeaders = {
    userId: '123456789',
  };

  // all other tests use public users
  const publicUserHeaders = {
    userId: '987654321',
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
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  beforeEach(async () => {
    await clearDb(db);

    await createPilotUserHelper(db, {
      userId: parseInt(pilotUserHeaders.userId),
    });

    // create a list to be used in tests (no list items)
    shareableList = await createShareableListHelper(db, {
      userId: parseInt(publicUserHeaders.userId),
      title: 'This is a test list',
    });
    // create another list
    shareableList2 = await createShareableListHelper(db, {
      userId: parseInt(publicUserHeaders.userId),
      title: 'This is a second test list',
      // set list item notes public
      listItemNoteVisibility: Visibility.PUBLIC,
    });
  });

  describe('shareableList query', () => {
    it('should not return a list not owned by the given user', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set({
          userId: '848135',
        })
        .send({
          query: print(GET_SHAREABLE_LIST),
          variables: {
            externalId: shareableList.externalId,
          },
        });

      // There should be nothing in results
      expect(result.body.data.shareableList).toBeNull();

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });
    it('should return a "Not Found" error if no list exists', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(GET_SHAREABLE_LIST),
          variables: {
            externalId: 'this-will-not-be-found',
          },
        });

      // There should be nothing in results
      expect(result.body.data.shareableList).toBeNull();

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('should return a list with all props if it exists', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(GET_SHAREABLE_LIST),
          variables: {
            externalId: shareableList.externalId,
          },
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');

      // A result should be returned
      expect(result.body.data.shareableList).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // Now onto verifying individual list props
      const list = result.body.data.shareableList;

      // Values we know as we've assigned them manually
      expect(list.title).toBe(shareableList.title);
      expect(list.description).toBe(shareableList.description);

      // Default status values
      expect(list.status).toBe(Visibility.PRIVATE);
      expect(list.moderationStatus).toBe(ModerationStatus.VISIBLE);

      // Variable values that just need to be non-null - we know Prisma
      // returns them in a compatible format
      expect(list.createdAt).not.toHaveLength(0);
      expect(list.updatedAt).not.toHaveLength(0);
      expect(list.externalId).not.toHaveLength(0);

      // Empty slug - it's not generated on creation
      expect(list.slug).toBeNull();

      // the user entity should be present with the id of the creator
      expect(list.user).toEqual({ id: publicUserHeaders.userId });

      // Empty list items array
      expect(list.listItems).toHaveLength(0);

      // default list item note visibility (not set explicitly upon creation)
      expect(list.listItemNoteVisibility).toBe(Visibility.PRIVATE);
    });

    it('should return a list with sorted list items', async () => {
      const seed = [
        { sortOrder: 2 },
        { sortOrder: 1 },
        // unset/0 (default) sort orders (itemId fallback sort)
        { itemId: 12345 },
        { itemId: 67890 },
      ];
      await Promise.all(
        seed.map((data) =>
          createShareableListItemHelper(db, {
            list: shareableList,
            ...data,
          }),
        ),
      );

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(GET_SHAREABLE_LIST),
          variables: {
            externalId: shareableList.externalId,
          },
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');

      // A result should be returned
      expect(result.body.data.shareableList).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // There should be two list items
      expect(result.body.data.shareableList.listItems).toHaveLength(4);

      const listItems = result.body.data.shareableList.listItems;
      const expected = [
        { sortOrder: 0, itemId: '12345' },
        { sortOrder: 0, itemId: '67890' },
        { sortOrder: 1 },
        { sortOrder: 2 },
      ];

      listItems.forEach((listItem, ix) => {
        expect(listItem).toMatchObject({
          ...basicListItemMatcher,
          ...expected[ix],
        });
      });
    });
  });

  describe('shareableListPublic query', () => {
    it('should return a "Not Found" error if no list exists', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_SHAREABLE_LIST_PUBLIC),
          variables: {
            externalId: '1234-abcd',
            slug: 'bad-slug',
          },
        });
      // There should be nothing in results
      expect(result.body.data.shareableListPublic).toBeNull();

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('should return a 403 error if list has been taken down', async () => {
      // First we need a list that has been taken down
      // create another list
      const list = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'This is a list that does not comply with our policies',
        slug: 'this-is-a-list-that-does-not-comply',
        status: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.HIDDEN,
      });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_SHAREABLE_LIST_PUBLIC),
          variables: {
            externalId: list.externalId,
            slug: list.slug,
          },
        });

      // There should be nothing in results
      expect(result.body.data.shareableListPublic).toBeNull();

      // And a "Forbidden" error
      expect(result.body.errors[0].extensions.code).toBe('FORBIDDEN');
      expect(result.body.errors[0].message).toBe(ACCESS_DENIED_ERROR);
    });

    it('should return a NotFound error if list is Private', async () => {
      const privateList = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'This is a list that is Private',
        slug: 'this-is-a-list-that-is-private',
        status: Visibility.PRIVATE,
        moderationStatus: ModerationStatus.VISIBLE,
      });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_SHAREABLE_LIST_PUBLIC),
          variables: {
            externalId: privateList.externalId,
            slug: privateList.slug,
          },
        });

      // There should be nothing in results
      expect(result.body.data.shareableListPublic).toBeNull();

      // And a "Forbidden" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toBe(
        'Error - Not Found: A list by that URL could not be found',
      );
    });

    it('should return a NotFound error if externalId is valid but slug is invalid', async () => {
      const newList = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'This is a list',
        slug: 'this-is-a-list',
        status: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.VISIBLE,
      });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_SHAREABLE_LIST_PUBLIC),
          variables: {
            externalId: newList.externalId,
            slug: 'bad-slug',
          },
        });

      // There should be nothing in results
      expect(result.body.data.shareableListPublic).toBeNull();

      // And a "Forbidden" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
      expect(result.body.errors[0].message).toBe(
        'Error - Not Found: A list by that URL could not be found',
      );
    });

    it('should return a list with all props if it is accessible', async () => {
      const newList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'This is a list that does comply with our policies',
        slug: 'this-is-a-list-that-does-comply',
        status: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.VISIBLE,
      });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_SHAREABLE_LIST_PUBLIC),
          variables: {
            externalId: newList.externalId,
            slug: newList.slug,
          },
        });

      /// This query should be cached, expect headers.cache-control = max-age=60, public
      expect(result.headers['cache-control']).toBe('max-age=60, public');

      // A result should be returned
      expect(result.body.data.shareableList).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // Now onto verifying individual list props
      const list = result.body.data.shareableListPublic;
      // Values we know as we've assigned them manually
      expect(list.title).toBe(newList.title);
      expect(list.description).toBe(newList.description);

      // Default status values
      expect(list.status).toBe(Visibility.PUBLIC);
      expect(list.moderationStatus).toBe(ModerationStatus.VISIBLE);

      // Variable values that just need to be non-null - we know Prisma
      // returns them in a compatible format
      expect(list.createdAt).not.toHaveLength(0);
      expect(list.updatedAt).not.toHaveLength(0);
      expect(list.externalId).not.toHaveLength(0);

      // Empty slug - it's not generated on creation
      expect(list.slug).not.toHaveLength(0);

      // the user should match the id of the creator
      expect(list.user).toEqual({ id: newList.userId.toString() });

      // Empty list items array
      expect(list.listItems).toHaveLength(0);

      // default PRIVATE listItemNoteVisibility
      expect(list.listItemNoteVisibility).toBe(Visibility.PRIVATE);
    });

    it('should return a list with sorted list items', async () => {
      const newList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'This is a new list',
        slug: 'the-slug',
        status: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.VISIBLE,
        listItemNoteVisibility: Visibility.PRIVATE,
      });

      // Create a couple of list items with specific sort orders
      await createShareableListItemHelper(db, { list: newList, sortOrder: 2 });
      await createShareableListItemHelper(db, { list: newList, sortOrder: 1 });

      // Create a couple more with default/0 sort orders
      await createShareableListItemHelper(db, { list: newList, itemId: 12345 });
      await createShareableListItemHelper(db, { list: newList, itemId: 67890 });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_SHAREABLE_LIST_PUBLIC),
          variables: {
            externalId: newList.externalId,
            slug: newList.slug,
          },
        });

      // This query should be cached, expect headers.cache-control = max-age=60, public
      expect(result.headers['cache-control']).toBe('max-age=60, public');

      // A result should be returned
      expect(result.body.data.shareableListPublic).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      const listItems = result.body.data.shareableListPublic.listItems;

      // There should be two list items
      expect(listItems).toHaveLength(4);

      const expected = [
        { sortOrder: 0, itemId: '12345' },
        { sortOrder: 0, itemId: '67890' },
        { sortOrder: 1 },
        { sortOrder: 2 },
      ];

      listItems.forEach((listItem, ix) => {
        expect(listItem).toMatchObject({
          ...basicListItemMatcher,
          note: null,
          ...expected[ix],
        });
      });
    });

    it('should return a list with list items and public notes', async () => {
      const newList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'This is a new list',
        slug: 'the-slug',
        status: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.VISIBLE,
        listItemNoteVisibility: Visibility.PUBLIC,
      });

      // Create a couple of list items
      await createShareableListItemHelper(db, { list: newList });
      await createShareableListItemHelper(db, { list: newList });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_SHAREABLE_LIST_PUBLIC),
          variables: {
            externalId: newList.externalId,
            slug: newList.slug,
          },
        });

      // This query should be cached, expect headers.cache-control = max-age=60, public
      expect(result.headers['cache-control']).toBe('max-age=60, public');

      // A result should be returned
      expect(result.body.data.shareableListPublic).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // There should be two list items
      expect(result.body.data.shareableListPublic.listItems).toHaveLength(2);

      // listItemNoteVisibility is PUBLIC in this scenario
      expect(result.body.data.shareableListPublic.listItemNoteVisibility).toBe(
        Visibility.PUBLIC,
      );

      // Let's run through the visible props of each item
      // to make sure they're all there
      result.body.data.shareableListPublic.listItems.forEach((listItem) => {
        expect(listItem).toMatchObject({
          ...basicListItemMatcher,
          note: expect.toSatisfy(toBeNonEmptyString),
        });
      });
    });
  });

  describe('shareableLists query', () => {
    it('should return an empty shareableLists array if no lists exist for a given userId', async () => {
      // set headers for userId which has no lists
      const testHeaders = { userId: '7732025862' };
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(testHeaders)
        .send({
          query: print(GET_SHAREABLE_LISTS),
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');

      // The returned shareableLists array should be empty
      expect(result.body.data.shareableLists.length).toBe(0);
    });

    it('should return an array of lists with all props if it exists for a given userId', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(GET_SHAREABLE_LISTS),
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');

      // A result should be returned
      expect(result.body.data.shareableList).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // Expect the array length to contain 2 lists
      expect(result.body.data.shareableLists.length).toBe(2);

      // We also want to assert that the first list returned in the array is the most recently created
      const listArray = [shareableList2, shareableList];

      let list;

      // Loop over both lists and check their values are as expected
      for (let i = 0; i < listArray.length; i++) {
        list = result.body.data.shareableLists[i];

        expect(list.title).toBe(listArray[i].title);
        expect(list.slug).toBe(listArray[i].slug);
        expect(list.description).toBe(listArray[i].description);
        expect(list.status).toBe(Visibility.PRIVATE);
        expect(list.moderationStatus).toBe(ModerationStatus.VISIBLE);
        expect(list.createdAt).not.toHaveLength(0);
        expect(list.updatedAt).not.toHaveLength(0);
        expect(list.externalId).not.toHaveLength(0);
        // Empty list items array
        expect(list.listItems).toHaveLength(0);
        expect(list.listItemNoteVisibility).toBe(
          listArray[i].listItemNoteVisibility,
        );
      }
    });

    it('should return an array of lists with sorted list items for a given userId', async () => {
      const seed = [
        { list: shareableList, sortOrder: 2 },
        { list: shareableList, sortOrder: 1 },
        // default/0 sort order
        { list: shareableList, itemId: 12345 },
        { list: shareableList, itemId: 67890 },
        // Create a couple of list items for list2
        { list: shareableList2, sortOrder: 6 },
        { list: shareableList2, sortOrder: 2 },
      ];
      await Promise.all(
        seed.map((data) => createShareableListItemHelper(db, data)),
      );
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(GET_SHAREABLE_LISTS),
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');

      // A result should be returned
      expect(result.body.data.shareableLists).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // There should be two list items for the first List in the array
      expect(result.body.data.shareableLists[0].listItems).toHaveLength(2);
      // There should be four list items for the second List in the array
      expect(result.body.data.shareableLists[1].listItems).toHaveLength(4);

      // Let's double-check the returned array is ordered correctly
      // Note that the variable is named shareableList2, but it's in the first index
      expect(result.body.data.shareableLists[0].title).toBe(
        shareableList2.title,
      );
      expect(result.body.data.shareableLists[1].title).toBe(
        shareableList.title,
      );

      expect(result.body.data.shareableLists[0].user).toEqual({
        id: publicUserHeaders.userId,
      });
      expect(result.body.data.shareableLists[1].user).toEqual({
        id: publicUserHeaders.userId,
      });
      const expectdSecondListResponse = [
        { sortOrder: 0, itemId: '12345' },
        { sortOrder: 0, itemId: '67890' },
        { sortOrder: 1 },
        { sortOrder: 2 },
      ];
      const expectedFirstListResponse = [{ sortOrder: 2 }, { sortOrder: 6 }];
      result.body.data.shareableLists[0].listItems.forEach((listItem, ix) => {
        expect(listItem).toMatchObject({
          ...basicListItemMatcher,
          ...expectedFirstListResponse[ix],
        });
      });
      result.body.data.shareableLists[1].listItems.forEach((listItem, ix) => {
        expect(listItem).toMatchObject({
          ...basicListItemMatcher,
          ...expectdSecondListResponse[ix],
        });
      });
    });
  });
});
