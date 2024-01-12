import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { print } from 'graphql';
import request from 'supertest';
import { IAdminContext } from '../../context';
import { startServer } from '../../../express';
import { client } from '../../../database/client';
import { clearDb, mockRedisServer } from '../../../test/helpers';
import { SEARCH_SHAREABLE_LIST } from './sample-queries.gql';
import {
  ACCESS_DENIED_ERROR,
  FULLACCESS,
  READONLY,
} from '../../../shared/constants';
import { expect } from 'chai';

describe('auth: ShareableList', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${FULLACCESS}`,
  };

  beforeAll(async () => {
    mockRedisServer();
    // port 0 tells express to dynamically assign an available port
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
    db = client();
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('searchShareableList query', () => {
    it('should fail if auth headers are missing', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(SEARCH_SHAREABLE_LIST),
          variables: {
            externalId: 'fake-uuid',
          },
        });

      // There should be nothing in results
      expect(result.body.data.searchShareableList).to.be.null;
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if user does not have access', async () => {
      const badHeaders = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any moderation/read-only group
        groups: `group1,group2`,
      };
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(badHeaders)
        .send({
          query: print(SEARCH_SHAREABLE_LIST),
          variables: {
            externalId: 'fake-uuid',
          },
        });

      // There should be nothing in results
      expect(result.body.data.searchShareableList).to.be.null;
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should succeed if user has read only access', async () => {
      const readOnlyHeaders = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${READONLY}`,
      };
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(readOnlyHeaders)
        .send({
          query: print(SEARCH_SHAREABLE_LIST),
          variables: {
            externalId: 'fake-uuid',
          },
        });

      // We should get a not found error instead of a forbidden error
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
    });

    it('should succeed if user has full access', async () => {
      // Run the query we're testing
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(SEARCH_SHAREABLE_LIST),
          variables: {
            externalId: 'fake-uuid',
          },
        });

      // We should get a not found error instead of a forbidden error
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
    });
  });
});
