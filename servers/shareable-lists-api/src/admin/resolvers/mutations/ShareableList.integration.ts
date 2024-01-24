import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '.prisma/client';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { print } from 'graphql';
import request from 'supertest';
import { IAdminContext } from '../../context';
import { startServer } from '../../../express';
import { client } from '../../../database/client';
import {
  clearDb,
  createShareableListHelper,
  mockRedisServer,
} from '../../../test/helpers';
import {
  ACCESS_DENIED_ERROR,
  FULLACCESS,
  READONLY,
} from '../../../shared/constants';
import { MODERATE_SHAREABLE_LIST } from './sample-mutations.gql';
import { ShareableListModerationReason } from '../../../database/types';

const validHeaders = {
  name: 'Lee Moderator',
  username: 'moderator',
  groups: `somegroup,${FULLACCESS},othergroup2`,
};

describe('admin mutations: ShareableList', () => {
  let app: Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  beforeAll(async () => {
    mockRedisServer();
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
    db = client();
    // we mock the send method on EventBridgeClient
    jest
      .spyOn(EventBridgeClient.prototype, 'send')
      .mockClear()
      .mockImplementation(() => Promise.resolve({ FailedEntryCount: 0 }));
    await clearDb(db);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await db.$disconnect();
    await server.stop();
  });

  describe('moderateShareableList mutation', () => {
    it('must reject a user without full access', async () => {
      const headers = {
        name: 'Lee Moderator',
        username: 'moderator',
        groups: `somegroup,${READONLY},othergroup2`,
      };
      const data = {
        externalId: 'xid',
        moderationStatus: 'HIDDEN',
        moderationReason: ShareableListModerationReason.FRAUD,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(MODERATE_SHAREABLE_LIST),
          variables: {
            data: data,
          },
        });
      expect(result.body.data.moderateShareableList).toBeNull();
      expect(result.body.errors[0].message).toBe(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });
    it('must 404 if the list does not exist', async () => {
      const data = {
        externalId: 'xid',
        moderationStatus: 'HIDDEN',
        moderationReason: ShareableListModerationReason.FRAUD,
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(validHeaders)
        .send({
          query: print(MODERATE_SHAREABLE_LIST),
          variables: {
            data: data,
          },
        });
      expect(result.body.data.moderateShareableList).toBeNull();
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });
    it('will fail to hide list if moderationReason is not passed', async () => {
      const theList = await createShareableListHelper(db, {
        userId: 12345,
        title: 'Moderate this list',
        moderationStatus: 'VISIBLE',
      });
      expect(theList.moderationStatus).toBe('VISIBLE');
      const data = {
        externalId: theList.externalId,
        moderationStatus: 'HIDDEN',
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(validHeaders)
        .send({
          query: print(MODERATE_SHAREABLE_LIST),
          variables: {
            data: data,
          },
        });
      expect(result.body.data.moderateShareableList).toBeNull();
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });
    it('can make a visible list hidden', async () => {
      const theList = await createShareableListHelper(db, {
        userId: 12345,
        title: 'Moderate this list',
        moderationStatus: 'VISIBLE',
      });
      expect(theList.moderationStatus).toBe('VISIBLE');
      const data = {
        externalId: theList.externalId,
        moderationStatus: 'HIDDEN',
        moderationReason: ShareableListModerationReason.FRAUD,
        moderationDetails: 'making list hidden',
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(validHeaders)
        .send({
          query: print(MODERATE_SHAREABLE_LIST),
          variables: {
            data: data,
          },
        });
      const moderatedList = result.body.data.moderateShareableList;
      expect(moderatedList).not.toBeNull();
      expect(moderatedList.externalId).toBe(theList.externalId);
      expect(moderatedList.moderationStatus).toBe(data.moderationStatus);
      expect(moderatedList.moderationReason).toBe(data.moderationReason);
      expect(moderatedList.moderationDetails).toBe(data.moderationDetails);
    });
    it('will fail to restore list if restorationReason is not passed', async () => {
      const theList = await createShareableListHelper(db, {
        userId: 12345,
        title: 'Moderate this list',
        moderationStatus: 'HIDDEN',
      });
      expect(theList.moderationStatus).toBe('HIDDEN');
      const data = {
        externalId: theList.externalId,
        moderationStatus: 'VISIBLE',
        restorationReason: '\n', // should not consider this as valid input
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(validHeaders)
        .send({
          query: print(MODERATE_SHAREABLE_LIST),
          variables: {
            data: data,
          },
        });
      expect(result.body.data.moderateShareableList).toBeNull();
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });
    it('can make a hidden list visible', async () => {
      const theList = await createShareableListHelper(db, {
        userId: 12345,
        title: 'Moderate this list',
        moderationStatus: 'HIDDEN',
      });
      expect(theList.moderationStatus).toBe('HIDDEN');
      const data = {
        externalId: theList.externalId,
        moderationStatus: 'VISIBLE',
        restorationReason: 'making list visible now',
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(validHeaders)
        .send({
          query: print(MODERATE_SHAREABLE_LIST),
          variables: {
            data: data,
          },
        });
      const moderatedList = result.body.data.moderateShareableList;
      expect(moderatedList).not.toBeNull();
      expect(moderatedList.externalId).toBe(theList.externalId);
      expect(moderatedList.moderationStatus).toBe(data.moderationStatus);
      expect(moderatedList.restorationReason).toBe(data.restorationReason);
    });
    it('moderationDetails is optional', async () => {
      const theList = await createShareableListHelper(db, {
        userId: 12345,
        title: 'Moderate this list',
        moderationStatus: 'VISIBLE',
      });
      const data = {
        externalId: theList.externalId,
        moderationStatus: 'HIDDEN',
        moderationReason: ShareableListModerationReason.FRAUD,
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(validHeaders)
        .send({
          query: print(MODERATE_SHAREABLE_LIST),
          variables: {
            data: data,
          },
        });
      const moderatedList = result.body.data.moderateShareableList;
      expect(moderatedList).not.toBeNull();
      expect(moderatedList.externalId).toBe(theList.externalId);
      expect(moderatedList.moderationStatus).toBe(data.moderationStatus);
      expect(moderatedList.moderationReason).toBe(data.moderationReason);
      expect(moderatedList.moderationDetails).toBeNull();
    });
  });
});
