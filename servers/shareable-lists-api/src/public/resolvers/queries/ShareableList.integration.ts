import { expect } from 'chai';
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

describe('public queries: ShareableList', () => {
  let app: Express.Application;
  let server: ApolloServer<IPublicContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let shareableList: List;
  let shareableList2: List;

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
      expect(result.body.data.shareableList).to.be.null;

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
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
      expect(result.body.data.shareableList).to.be.null;

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
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
      expect(result.headers['cache-control']).to.equal('no-store');

      // A result should be returned
      expect(result.body.data.shareableList).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // Now onto verifying individual list props
      const list = result.body.data.shareableList;

      // Values we know as we've assigned them manually
      expect(list.title).to.equal(shareableList.title);
      expect(list.description).to.equal(shareableList.description);

      // Default status values
      expect(list.status).to.equal(Visibility.PRIVATE);
      expect(list.moderationStatus).to.equal(ModerationStatus.VISIBLE);

      // Variable values that just need to be non-null - we know Prisma
      // returns them in a compatible format
      expect(list.createdAt).not.to.be.empty;
      expect(list.updatedAt).not.to.be.empty;
      expect(list.externalId).not.to.be.empty;

      // Empty slug - it's not generated on creation
      expect(list.slug).to.be.null;

      // the user entity should be present with the id of the creator
      expect(list.user).to.deep.equal({ id: publicUserHeaders.userId });

      // Empty list items array
      expect(list.listItems).to.have.lengthOf(0);

      // default list item note visibility (not set explicitly upon creation)
      expect(list.listItemNoteVisibility).to.equal(Visibility.PRIVATE);
    });

    it('should return a list with sorted list items', async () => {
      // Create a couple of list items with specific sortOrders
      await createShareableListItemHelper(db, {
        list: shareableList,
        sortOrder: 2,
      });
      await createShareableListItemHelper(db, {
        list: shareableList,
        sortOrder: 1,
      });

      // Create a couple more with unset/0 (default) sort orders
      await createShareableListItemHelper(db, {
        list: shareableList,
        itemId: 12345, // set itemId so we can check proper fallback sorting
      });

      await createShareableListItemHelper(db, {
        list: shareableList,
        itemId: 67890, // set itemId so we can check proper fallback sorting
      });

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
      expect(result.headers['cache-control']).to.equal('no-store');

      // A result should be returned
      expect(result.body.data.shareableList).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // There should be two list items
      expect(result.body.data.shareableList.listItems).to.have.lengthOf(4);

      const listItems = result.body.data.shareableList.listItems;

      // Let's run through the visible props of each item
      // to make sure they're all there
      listItems.forEach((listItem) => {
        expect(listItem.itemId).not.to.be.empty;
        expect(listItem.url).not.to.be.empty;
        expect(listItem.title).not.to.be.empty;
        expect(listItem.excerpt).not.to.be.empty;
        expect(listItem.note).not.to.be.empty;
        expect(listItem.imageUrl).not.to.be.empty;
        expect(listItem.publisher).not.to.be.empty;
        expect(listItem.authors).not.to.be.empty;
        expect(listItem.sortOrder).to.be.a('number');
        expect(listItem.createdAt).not.to.be.empty;
        expect(listItem.updatedAt).not.to.be.empty;
      });

      // make sure list items are sorted in ascending order
      // items with the same sortOrder should be returned by createdAt asc
      expect(listItems[0].sortOrder).to.equal(0);
      // 12345 was created first
      expect(listItems[0].itemId).to.equal('12345');
      expect(listItems[1].sortOrder).to.equal(0);
      // 67890 was created second
      expect(listItems[1].itemId).to.equal('67890');
      expect(listItems[2].sortOrder).to.equal(1);
      expect(listItems[3].sortOrder).to.equal(2);
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
      expect(result.body.data.shareableListPublic).to.be.null;

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
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
      expect(result.body.data.shareableListPublic).to.be.null;

      // And a "Forbidden" error
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
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
      expect(result.body.data.shareableListPublic).to.be.null;

      // And a "Forbidden" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.equal(
        'Error - Not Found: A list by that URL could not be found'
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
      expect(result.body.data.shareableListPublic).to.be.null;

      // And a "Forbidden" error
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.errors[0].message).to.equal(
        'Error - Not Found: A list by that URL could not be found'
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
      expect(result.headers['cache-control']).to.equal('max-age=60, public');

      // A result should be returned
      expect(result.body.data.shareableList).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // Now onto verifying individual list props
      const list = result.body.data.shareableListPublic;
      // Values we know as we've assigned them manually
      expect(list.title).to.equal(newList.title);
      expect(list.description).to.equal(newList.description);

      // Default status values
      expect(list.status).to.equal(Visibility.PUBLIC);
      expect(list.moderationStatus).to.equal(ModerationStatus.VISIBLE);

      // Variable values that just need to be non-null - we know Prisma
      // returns them in a compatible format
      expect(list.createdAt).not.to.be.empty;
      expect(list.updatedAt).not.to.be.empty;
      expect(list.externalId).not.to.be.empty;

      // Empty slug - it's not generated on creation
      expect(list.slug).to.not.be.empty;

      // the user should match the id of the creator
      expect(list.user).to.deep.equal({ id: newList.userId.toString() });

      // Empty list items array
      expect(list.listItems).to.have.lengthOf(0);

      // default PRIVATE listItemNoteVisibility
      expect(list.listItemNoteVisibility).to.equal(Visibility.PRIVATE);
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
      expect(result.headers['cache-control']).to.equal('max-age=60, public');

      // A result should be returned
      expect(result.body.data.shareableListPublic).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      const listItems = result.body.data.shareableListPublic.listItems;

      // There should be two list items
      expect(listItems).to.have.lengthOf(4);

      // Let's run through the visible props of each item
      // to make sure they're all there
      listItems.forEach((listItem) => {
        expect(listItem.itemId).not.to.be.empty;
        expect(listItem.url).not.to.be.empty;
        expect(listItem.title).not.to.be.empty;
        expect(listItem.excerpt).not.to.be.empty;
        // note should be empty because the visibility on the list is PRIVATE
        expect(listItem.note).to.be.null;
        expect(listItem.imageUrl).not.to.be.empty;
        expect(listItem.publisher).not.to.be.empty;
        expect(listItem.authors).not.to.be.empty;
        expect(listItem.sortOrder).to.be.a('number');
        expect(listItem.createdAt).not.to.be.empty;
        expect(listItem.updatedAt).not.to.be.empty;
      });

      // make sure list items are sorted in ascending order
      // items with the same sortOrder should be returned by createdAt asc
      expect(listItems[0].sortOrder).to.equal(0);
      // 12345 was created first
      expect(listItems[0].itemId).to.equal('12345');
      expect(listItems[1].sortOrder).to.equal(0);
      // 67890 was created second
      expect(listItems[1].itemId).to.equal('67890');
      expect(listItems[2].sortOrder).to.equal(1);
      expect(listItems[3].sortOrder).to.equal(2);
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
      expect(result.headers['cache-control']).to.equal('max-age=60, public');

      // A result should be returned
      expect(result.body.data.shareableListPublic).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // There should be two list items
      expect(result.body.data.shareableListPublic.listItems).to.have.lengthOf(
        2
      );

      // listItemNoteVisibility is PUBLIC in this scenario
      expect(
        result.body.data.shareableListPublic.listItemNoteVisibility
      ).to.equal(Visibility.PUBLIC);

      // Let's run through the visible props of each item
      // to make sure they're all there
      result.body.data.shareableListPublic.listItems.forEach((listItem) => {
        expect(listItem.itemId).not.to.be.empty;
        expect(listItem.url).not.to.be.empty;
        expect(listItem.title).not.to.be.empty;
        expect(listItem.excerpt).not.to.be.empty;
        // note should not be empty because the visibility on the list is PUBLIC
        expect(listItem.note).not.to.be.empty;
        expect(listItem.imageUrl).not.to.be.empty;
        expect(listItem.publisher).not.to.be.empty;
        expect(listItem.authors).not.to.be.empty;
        expect(listItem.sortOrder).to.be.a('number');
        expect(listItem.createdAt).not.to.be.empty;
        expect(listItem.updatedAt).not.to.be.empty;
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
      expect(result.headers['cache-control']).to.equal('no-store');

      // The returned shareableLists array should be empty
      expect(result.body.data.shareableLists.length).to.equal(0);
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
      expect(result.headers['cache-control']).to.equal('no-store');

      // A result should be returned
      expect(result.body.data.shareableList).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // Expect the array length to contain 2 lists
      expect(result.body.data.shareableLists.length).to.equal(2);

      // We also want to assert that the first list returned in the array is the most recently created
      const listArray = [shareableList2, shareableList];

      let list;

      // Loop over both lists and check their values are as expected
      for (let i = 0; i < listArray.length; i++) {
        list = result.body.data.shareableLists[i];

        expect(list.title).to.equal(listArray[i].title);
        expect(list.slug).to.equal(listArray[i].slug);
        expect(list.description).to.equal(listArray[i].description);
        expect(list.status).to.equal(Visibility.PRIVATE);
        expect(list.moderationStatus).to.equal(ModerationStatus.VISIBLE);
        expect(list.createdAt).not.to.be.empty;
        expect(list.updatedAt).not.to.be.empty;
        expect(list.externalId).not.to.be.empty;
        // Empty list items array
        expect(list.listItems).to.have.lengthOf(0);
        expect(list.listItemNoteVisibility).to.equal(
          listArray[i].listItemNoteVisibility
        );
      }
    });

    it('should return an array of lists with sorted list items for a given userId', async () => {
      // Create a couple of list items for list1
      await createShareableListItemHelper(db, {
        list: shareableList,
        sortOrder: 2,
      });
      await createShareableListItemHelper(db, {
        list: shareableList,
        sortOrder: 1,
      });

      // ...and a couple more with default/0 sort order
      await createShareableListItemHelper(db, {
        list: shareableList,
        itemId: 12345,
      });
      await createShareableListItemHelper(db, {
        list: shareableList,
        itemId: 67890,
      });
      // Create a couple of list items for list2
      await createShareableListItemHelper(db, {
        list: shareableList2,
        sortOrder: 6,
      });
      await createShareableListItemHelper(db, {
        list: shareableList2,
        sortOrder: 2,
      });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(GET_SHAREABLE_LISTS),
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');

      // A result should be returned
      expect(result.body.data.shareableLists).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // There should be two list items for the first List in the array
      expect(result.body.data.shareableLists[0].listItems).to.have.lengthOf(2);
      // There should be four list items for the second List in the array
      expect(result.body.data.shareableLists[1].listItems).to.have.lengthOf(4);

      // Let's double-check the returned array is ordered correctly
      expect(result.body.data.shareableLists[0].title).to.equal(
        shareableList2.title
      );
      expect(result.body.data.shareableLists[1].title).to.equal(
        shareableList.title
      );

      expect(result.body.data.shareableLists[0].user).to.deep.equal({
        id: publicUserHeaders.userId,
      });
      expect(result.body.data.shareableLists[1].user).to.deep.equal({
        id: publicUserHeaders.userId,
      });

      let listItems = result.body.data.shareableLists[0].listItems;

      // Let's run through the visible props of each item
      // to make sure they're all there for the first List
      listItems.forEach((listItem) => {
        expect(listItem.itemId).not.to.be.empty;
        expect(listItem.url).not.to.be.empty;
        expect(listItem.title).not.to.be.empty;
        expect(listItem.excerpt).not.to.be.empty;
        expect(listItem.imageUrl).not.to.be.empty;
        expect(listItem.publisher).not.to.be.empty;
        expect(listItem.authors).not.to.be.empty;
        expect(listItem.sortOrder).to.be.a('number');
        expect(listItem.createdAt).not.to.be.empty;
        expect(listItem.updatedAt).not.to.be.empty;
      });

      // make sure list items are sorted in ascending order
      expect(listItems[0].sortOrder).to.equal(2);
      expect(listItems[1].sortOrder).to.equal(6);

      listItems = result.body.data.shareableLists[1].listItems;

      // Let's run through the visible props of each item
      // to make sure they're all there for the second List
      listItems.forEach((listItem) => {
        expect(listItem.itemId).not.to.be.empty;
        expect(listItem.url).not.to.be.empty;
        expect(listItem.title).not.to.be.empty;
        expect(listItem.excerpt).not.to.be.empty;
        expect(listItem.note).not.to.be.empty;
        expect(listItem.imageUrl).not.to.be.empty;
        expect(listItem.publisher).not.to.be.empty;
        expect(listItem.authors).not.to.be.empty;
        expect(listItem.sortOrder).to.be.a('number');
        expect(listItem.createdAt).not.to.be.empty;
        expect(listItem.updatedAt).not.to.be.empty;
      });

      // make sure list items are sorted in ascending order
      expect(listItems[0].sortOrder).to.equal(0);
      expect(listItems[0].itemId).to.equal('12345');
      expect(listItems[1].sortOrder).to.equal(0);
      expect(listItems[1].itemId).to.equal('67890');

      expect(listItems[2].sortOrder).to.equal(1);
      expect(listItems[3].sortOrder).to.equal(2);
    });
  });
});
