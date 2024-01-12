import { ApolloServer } from '@apollo/server';
import {
  List,
  ListItem,
  Visibility,
  ModerationStatus,
  PrismaClient,
} from '@prisma/client';
import { print } from 'graphql';
import request from 'supertest';
import { IAdminContext } from '../../context';
import { startServer } from '../../../express';
import { client } from '../../../database/client';
import {
  clearDb,
  createShareableListHelper,
  createShareableListItemHelper,
  updateShareableListHelper,
  mockRedisServer,
} from '../../../test/helpers';
import { SEARCH_SHAREABLE_LIST } from './sample-queries.gql';
import { FULLACCESS } from '../../../shared/constants';
import { expect } from 'chai';
import config from '../../../config';
import slugify from 'slugify';

describe('admin queries: ShareableList', () => {
  let app: Express.Application;
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
      expect(result.body.data.searchShareableList).to.be.null;

      // And a "Not found" error
      expect(result.body).to.have.nested.property(
        'errors[0].extensions.code',
        'NOT_FOUND'
      );
    });

    it('should return a list with all props if it exists', async () => {
      // make list public
      await updateShareableListHelper(db, shareableList.externalId, {
        status: Visibility.PUBLIC,
        slug: slugify(shareableList.title, config.slugify),
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
      expect(result.body.data.searchShareableList).not.to.be.null;

      // There should be no errors
      expect(result.body.errors).to.be.undefined;

      // Now onto verifying individual list props
      const list = result.body.data.searchShareableList;

      // Values we know as we've assigned them manually
      expect(list.title).to.equal(shareableList.title);
      expect(list.description).to.equal(shareableList.description);

      // Default status values
      expect(list.status).to.equal(Visibility.PUBLIC);
      expect(list.moderationStatus).to.equal(ModerationStatus.VISIBLE);

      // Variable values that just need to be non-null - we know Prisma
      // returns them in a compatible format
      expect(list.createdAt).not.to.be.empty;
      expect(list.updatedAt).not.to.be.empty;
      expect(list.externalId).not.to.be.empty;

      // Make sure slug is not empty
      expect(list.slug).not.to.be.empty;

      // Assert that all props are returned
      const listItem = list.listItems[0];

      expect(listItem.externalId).not.to.be.empty;
      expect(listItem.itemId).to.equal('3834701731');
      expect(listItem.url).to.equal(shareableListItem.url);
      expect(listItem.title).to.equal(shareableListItem.title);
      expect(listItem.excerpt).to.equal(shareableListItem.excerpt);
      expect(listItem.note).to.equal(shareableListItem.note);
      expect(listItem.imageUrl).to.equal(shareableListItem.imageUrl);
      expect(listItem.publisher).to.equal(shareableListItem.publisher);
      expect(listItem.authors).to.equal(shareableListItem.authors);
      expect(listItem.sortOrder).to.equal(1);
      expect(listItem.createdAt).not.to.be.empty;
      expect(listItem.updatedAt).not.to.be.empty;
    });
  });
});
