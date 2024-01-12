import { ApolloServer } from '@apollo/server';
import { PilotUser, PrismaClient } from '@prisma/client';
import { print } from 'graphql';
import request from 'supertest';
import { IPublicContext } from '../../context';
import { startServer } from '../../../express';
import { client } from '../../../database/client';
import {
  clearDb,
  createPilotUserHelper,
  mockRedisServer,
} from '../../../test/helpers';
import { SHAREABLE_LISTS_PILOT_USER } from './sample-queries.gql';
import { expect } from 'chai';

describe('public queries: PilotUser', () => {
  let app: Express.Application;
  let server: ApolloServer<IPublicContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  let pilotUser: PilotUser;

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

  beforeEach(async () => {
    await clearDb(db);

    // create a pilot user
    pilotUser = await createPilotUserHelper(db, {
      userId: 8009882300,
    });
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('isPilotUser query', () => {
    it('should return true if user is in the pilot', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set({
          // the id of the pilot user we created above
          userId: pilotUser.userId.toString(),
        })
        .send({
          query: print(SHAREABLE_LISTS_PILOT_USER),
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');

      expect(result.body.data.shareableListsPilotUser).to.be.true;
    });

    it('should return false if user is not in the pilot', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set({
          // *not* the id of the pilot user we created above
          userId: '7732025862',
        })
        .send({
          query: print(SHAREABLE_LISTS_PILOT_USER),
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');

      expect(result.body.data.shareableListsPilotUser).to.be.false;
    });

    it('should return false if userId is empty', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set({
          // userId is not set
          userId: '',
        })
        .send({
          query: print(SHAREABLE_LISTS_PILOT_USER),
        });

      // This query should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).to.equal('no-store');

      expect(result.body.data.shareableListsPilotUser).to.be.false;
    });
  });
});
