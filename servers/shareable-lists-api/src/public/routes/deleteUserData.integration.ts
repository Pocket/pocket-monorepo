import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import * as Sentry from '@sentry/node';
import { PrismaClient } from '@prisma/client';
import { startServer } from '../../express';
import { IPublicContext } from '../context';
import { client } from '../../database/client';
import {
  clearDb,
  createShareableListHelper,
  createShareableListItemHelper,
  mockRedisServer,
} from '../../test/helpers';
import {
  getAllShareableListIdsForUser,
  deleteShareableListItemsForUser,
} from './deleteUserData';

describe('/deleteUserData express endpoint', () => {
  let app: Express.Application;
  let server: ApolloServer<IPublicContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let sentryStub;
  let list1;
  let list2;
  let list3;

  const headers = {
    userId: '8009882300',
  };

  const headers2 = {
    userId: '76543',
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

  afterEach(() => {
    sentryStub.restore();
  });

  beforeEach(async () => {
    sentryStub = sinon.stub(Sentry, 'captureException').resolves();
    await clearDb(db);

    // Create a few Lists
    list1 = await createShareableListHelper(db, {
      userId: parseInt(headers.userId),
      title: 'Simon Le Bon List',
    });

    list2 = await createShareableListHelper(db, {
      userId: parseInt(headers.userId),
      title: 'Bon Voyage List',
    });

    // Create a List for user 2
    list3 = await createShareableListHelper(db, {
      userId: parseInt(headers2.userId),
      title: 'Rolling Stones List',
    });

    // then create 5 list items for each list
    for (let i = 0; i < 5; i++) {
      await createShareableListItemHelper(db, {
        list: list1,
      });
      await createShareableListItemHelper(db, {
        list: list2,
      });
    }
  });

  describe('should delete all shareable list user data for userId', () => {
    it('should not delete any data for userId with no data and should not return error', async () => {
      const result = await request(app)
        .post(graphQLUrl + 'deleteUserData')
        .set('Content-Type', 'application/json')
        .send({ userId: '12345' });
      expect(result.body.status).to.equal('OK');
      expect(result.body.message).to.contain(
        `No shareable list data to delete for User ID: 12345`
      );
    });

    it('should fail deleteUserData schema validation if bad userId', async () => {
      const result = await request(app)
        .post(graphQLUrl + 'deleteUserData')
        .set('Content-Type', 'application/json')
        .send({ userId: 'abc-12345' });
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].msg).to.equal('Must provide valid userId');
    });

    it('should successfully deleteUserData for a userId', async () => {
      const result = await request(app)
        .post(graphQLUrl + 'deleteUserData')
        .set('Content-Type', 'application/json')
        .send({ userId: headers.userId });
      expect(result.body.status).to.equal('OK');
      expect(result.body.message).to.contain(
        `Deleting shareable lists data for User ID: ${headers.userId}`
      );
      // lets manually call getAllShareableListIdsForUser to check there are no lists for this user
      const ids = await getAllShareableListIdsForUser(parseInt(headers.userId));
      expect(ids.length).to.equal(0);
    });
  });

  describe('getAllShareableListIdsForUser', () => {
    it('should return empty array for userId with no lists in db', async () => {
      const ids = await getAllShareableListIdsForUser(234567);
      expect(ids.length).to.equal(0);
    });
    it('should return appropriate list ids for user', async () => {
      let ids = await getAllShareableListIdsForUser(parseInt(headers.userId));
      expect(ids.length).to.equal(2);
      // check the returned ids are what we expect
      expect(ids[0]).to.equal(parseInt(list1.id as unknown as string));
      expect(ids[1]).to.equal(parseInt(list2.id as unknown as string));

      // get listIds for another user
      ids = await getAllShareableListIdsForUser(parseInt(headers2.userId));
      expect(ids.length).to.equal(1);
      // check the returned ids are what we expect
      expect(ids[0]).to.equal(parseInt(list3.id as unknown as string));
    });
  });

  describe('deleteShareableListItemsForUser', () => {
    it('should return count=0 for deleting 0 list items for user with no list items', async () => {
      // pilotUser 2 has one list (list3) but 0 list items
      const count = await deleteShareableListItemsForUser([
        parseInt(list3.id as unknown as string),
      ]);
      // there should be no list items found for list 3
      expect(count).to.equal(0);
    });
    it('should return correct count of deleted list items for user with list items', async () => {
      // pilotUser 1 has two lists (list1, list2) and 5 list items per list
      const count = await deleteShareableListItemsForUser([
        parseInt(list1.id as unknown as string),
        parseInt(list2.id as unknown as string),
      ]);
      // there should be 10 total list items deleted
      expect(count).to.equal(10);
    });
  });
});
