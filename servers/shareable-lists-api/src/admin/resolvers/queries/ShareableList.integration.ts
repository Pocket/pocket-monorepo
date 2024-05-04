import { ApolloServer } from '@apollo/server';
import {
  List,
  ListItem,
  Visibility,
  ModerationStatus,
  PrismaClient,
} from 'generated-prisma/client/index.js';
import { print } from 'graphql';
import request from 'supertest';
import { IAdminContext } from '../../context.js';
import { startServer } from '../../../express.js';
import { client } from '../../../database/client.js';
import {
  clearDb,
  createShareableListHelper,
  createShareableListItemHelper,
  updateShareableListHelper,
  mockRedisServer,
} from '../../../test/helpers/index.js';
import { SEARCH_SHAREABLE_LIST } from './sample-queries.gql.js';
import { FULLACCESS } from '../../../shared/constants.js';
import config from '../../../config/index.js';
import * as slugify from 'slugify';
import { Application } from 'express';

describe('admin queries: ShareableList', () => {
  let app: Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let shareableList: List;
  let shareableListItem: ListItem;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    // default to full access - auth tests occur in a separate test file
    groups: `group1,group2,${FULLACCESS}`,
  };

  beforeAll(async () => {
    mockRedisServer();
    // port 0 tells express to dynamically assign an available port
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
    db = client();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  beforeEach(async () => {
    await clearDb(db);

    // create a list to be used in tests (no list items)
    shareableList = await createShareableListHelper(db, {
      userId: 12345,
      title: 'Burning Rose',
    });

    // create shareable list item
    shareableListItem = await createShareableListItemHelper(db, {
      list: shareableList,
      url: 'https://www.test.com/duplicate-url',
      sortOrder: 1,
      itemId: 3834701731,
    });
  });

  describe('searchShareableList query', () => {
    it('should return a "Not Found" error if no list exists', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(SEARCH_SHAREABLE_LIST),
          variables: {
            externalId: 'this-will-not-be-found',
          },
        });

      // There should be nothing in results
      expect(result.body.data.searchShareableList).toBeNull();

      // And a "Not found" error
      expect(result.body).toHaveProperty(
        'errors[0].extensions.code',
        'NOT_FOUND',
      );
    });

    it('should return a list with all props if it exists', async () => {
      // make list public
      await updateShareableListHelper(db, shareableList.externalId, {
        status: Visibility.PUBLIC,
        slug: slugify.default(shareableList.title, config.slugify),
      });

      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(SEARCH_SHAREABLE_LIST),
          variables: {
            externalId: shareableList.externalId,
          },
        });

      // A result should be returned
      expect(result.body.data.searchShareableList).not.toBeNull();

      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // Now onto verifying individual list props
      const list = result.body.data.searchShareableList;

      // Values we know as we've assigned them manually
      expect(list.title).toBe(shareableList.title);
      expect(list.description).toBe(shareableList.description);

      // Default status values
      expect(list.status).toBe(Visibility.PUBLIC);
      expect(list.moderationStatus).toBe(ModerationStatus.VISIBLE);

      // Variable values that just need to be non-null - we know Prisma
      // returns them in a compatible format
      expect(list.createdAt).not.toHaveLength(0);
      expect(list.updatedAt).not.toHaveLength(0);
      expect(list.externalId).not.toHaveLength(0);

      // Make sure slug is not empty
      expect(list.slug).not.toHaveLength(0);

      // Assert that all props are returned
      const listItem = list.listItems[0];

      expect(listItem.externalId).not.toHaveLength(0);
      expect(listItem.itemId).toBe('3834701731');
      expect(listItem.url).toBe(shareableListItem.url);
      expect(listItem.title).toBe(shareableListItem.title);
      expect(listItem.excerpt).toBe(shareableListItem.excerpt);
      expect(listItem.note).toBe(shareableListItem.note);
      expect(listItem.imageUrl).toBe(shareableListItem.imageUrl);
      expect(listItem.publisher).toBe(shareableListItem.publisher);
      expect(listItem.authors).toBe(shareableListItem.authors);
      expect(listItem.sortOrder).toBe(1);
      expect(listItem.createdAt).not.toHaveLength(0);
      expect(listItem.updatedAt).not.toHaveLength(0);
    });
  });
});
