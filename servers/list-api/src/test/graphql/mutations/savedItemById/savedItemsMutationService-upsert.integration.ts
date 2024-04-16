import { readClient, writeClient } from '../../../../database/client';
import nock, { cleanAll } from 'nock';
import config from '../../../../config';
import {
  EventType,
  ItemsEventEmitter,
  SQSEvents,
  SqsListener,
} from '../../../../businessEvents';
import {
  PurgeQueueCommand,
  QueueAttributeName,
  ReceiveMessageCommand,
  ReceiveMessageCommandInput,
  ReceiveMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { sqs } from '../../../../aws/sqs';
import { getUnixTimestamp } from '../../../../utils';
import { transformers } from '../../../../businessEvents/sqs/transformers';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import type { Knex } from 'knex';

function mockParserGetItemRequest(urlToParse: string, data: any) {
  nock(config.parserDomain)
    .get(`/${config.parserVersion}/getItemListApi`)
    .query({ url: urlToParse, getItem: '1' })
    .reply(200, data)
    .persist();
}

async function getSqsMessages(
  queueUrl: string,
): Promise<ReceiveMessageCommandOutput> {
  const receiveParams: ReceiveMessageCommandInput = {
    AttributeNames: [QueueAttributeName.All],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ['All'],
    QueueUrl: queueUrl,
    VisibilityTimeout: 20,
    WaitTimeSeconds: 4,
  };
  const receiveCommand = new ReceiveMessageCommand(receiveParams);

  try {
    return await sqs.send(receiveCommand);
  } catch (err) {
    console.log('unable to read message from the queue', err);
  }
}

describe('UpsertSavedItem Mutation', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const itemsEventEmitter = new ItemsEventEmitter();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  new SqsListener(itemsEventEmitter, transformers);
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const unixDate = getUnixTimestamp(date);
  const dateNow = new Date('2021-10-06 03:22:00');
  const headers = { userid: '1' };
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    jest.useFakeTimers({ advanceTimers: true, now: dateNow });
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
    cleanAll();
    await server.stop();
  });

  afterEach(() => eventSpy.mockClear());

  beforeEach(async () => {
    await sqs.send(
      new PurgeQueueCommand({ QueueUrl: config.aws.sqs.publisherQueue.url }),
    );
    await sqs.send(
      new PurgeQueueCommand({
        QueueUrl: config.aws.sqs.permLibItemMainQueue.url,
      }),
    );
    await writeDb('item_tags').truncate();
    await writeDb('list').truncate();
    await writeDb('item_tags').insert([
      {
        user_id: 1,
        item_id: 8,
        tag: 'zebra',
        status: 1,
        time_added: null,
        time_updated: null,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      },
    ]);
  });
  describe('happy paths', () => {
    beforeAll(() => {
      const mockRequestData = [
        {
          url: 'http://getpocket.com',
          itemId: 8,
        },
        {
          url: 'http://google.com',
          itemId: 11,
        },
        {
          url: 'http://favorite.com',
          itemId: 2,
        },
        {
          url: 'http://eventemitter.com',
          itemId: 3,
        },
        {
          url: 'http://addingtoqueue.com',
          itemId: 25,
        },
        {
          url: 'http://write-client.com',
          itemId: 50,
        },
      ];
      mockRequestData.forEach(({ url, itemId }) =>
        mockParserGetItemRequest(url, {
          item: {
            given_url: url,
            item_id: itemId,
            resolved_id: itemId,
            title: url,
          },
        }),
      );
    });

    it('should add a valid item and return savedItem', async () => {
      const variables = {
        url: 'http://getpocket.com',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
            url
            title
            _createdAt
            _updatedAt
            favoritedAt
            archivedAt
            isFavorite
            isArchived
            _deletedAt
            _version
            item {
              ... on Item {
                givenUrl
              }
            }
            tags {
              name
            }
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(mutationResult).not.toBeNull();
      const data = mutationResult.body.data?.upsertSavedItem;
      expect(data.id).toEqual('8');
      expect(data.title).toEqual(variables.url);
      expect(data.url).toEqual(variables.url);
      expect(data.isFavorite).toBeFalse();
      expect(data.isArchived).toBeFalse();
      expect(data._deletedAt).toBeNull();
      expect(data._version).toBeNull();
      expect(data.item.givenUrl).toEqual(variables.url);
      expect(data.tags[0].name).toEqual('zebra');
      expect(data.archivedAt).toBeNull();
      expect(data.favoritedAt).toBeNull();
    });

    it('should return user provided title on the returned savedItem', async () => {
      const variables = {
        url: 'http://getpocket.com',
        title: 'test-user-title',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!, $title: String) {
          upsertSavedItem(input: { url: $url, title: $title }) {
            title
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(mutationResult).not.toBeNull();
      const data = mutationResult.body.data?.upsertSavedItem;
      expect(data.title).toEqual(variables.title);
    });

    it('should add an item to the list even if the parser has not yet resolved or cannot resolve it', async () => {
      const givenUrl = 'https://unresolved.url';
      mockParserGetItemRequest(givenUrl, {
        item: {
          given_url: givenUrl,
          item_id: 1,
          resolved_id: '0',
        },
      });

      const variables = { url: givenUrl };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
            item {
              ... on Item {
                __typename
                givenUrl
              }
              ... on PendingItem {
                __typename
                itemId
                url
              }
            }
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(mutationResult).not.toBeNull();
      const data = mutationResult.body.data?.upsertSavedItem;
      expect(data.id).toEqual('1');
      expect(data.item.givenUrl).toBeUndefined();
      expect(data.item.url).toEqual(givenUrl);
      expect(data.item.itemId).toEqual('1');
      expect(data.item.__typename).toEqual('PendingItem');
    });

    it('should updated time favourite and time updated if provided in input', async () => {
      const variables = {
        url: 'http://google.com',
        isFavorite: true,
        timestamp: unixDate,
      };

      const ADD_AN_ITEM = `
        mutation addAnItem(
          $url: String!
          $isFavorite: Boolean
          $timestamp: Int
        ) {
          upsertSavedItem(
            input: { url: $url, isFavorite: $isFavorite, timestamp: $timestamp }
          ) {
            id
            url
            _createdAt
            _updatedAt
            favoritedAt
            archivedAt
            isFavorite
            isArchived
            _deletedAt
            _version
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(mutationResult).not.toBeNull();
      const data = mutationResult.body.data?.upsertSavedItem;

      expect(data.id).toEqual('11');
      expect(data.url).toEqual(variables.url);
      expect(data.isFavorite).toBeTrue();
      expect(data.isArchived).toBeFalse();
      expect(data.archivedAt).toBeNull();
      expect(data._createdAt).toEqual(unixDate);
      expect(data.favoritedAt).toEqual(unixDate);
    });

    it('should set time favorite to current time if isFav is set', async () => {
      const variables = {
        url: 'http://favorite.com',
        isFavorite: true,
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!, $isFavorite: Boolean) {
          upsertSavedItem(input: { url: $url, isFavorite: $isFavorite }) {
            id
            url
            favoritedAt
            isFavorite
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      const data = mutationResult.body.data?.upsertSavedItem;

      expect(data.url).toEqual('http://favorite.com');
      expect(data.isFavorite).toBeTrue();
      expect(data.favoritedAt).not.toEqual(
        getUnixTimestamp(new Date('0000-00-00 00:00:00')),
      );
    });

    it('should emit event on successful insert', async () => {
      const variables = {
        url: 'http://eventemitter.com',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
            url
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });

      expect(eventSpy).toHaveBeenCalledTimes(1);
      const eventData = eventSpy.mock.calls[0];
      expect(eventData[0]).toEqual(EventType.ADD_ITEM);
      expect(eventData[1].url).toEqual(variables.url);
      expect(mutationResult.body.data?.upsertSavedItem.url).toEqual(
        variables.url,
      );
    });

    it('should not emit event for duplicate add', async () => {
      const variables = {
        url: 'http://eventemitter.com',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
            url
          }
        }
      `;
      await request(app)
        .post(url)
        .set(headers)
        .send({ query: ADD_AN_ITEM, variables });
      // Duplicate insert and reset event tracking
      eventSpy.mockClear();
      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(eventSpy).toHaveBeenCalledTimes(0);
      expect(mutationResult.body.data?.upsertSavedItem.url).toEqual(
        variables.url,
      );
    });

    it('should push addItem event to publisher data queue when an item is added', async () => {
      const variables = {
        url: 'http://addingtoqueue.com',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
            url
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(mutationResult.body.data?.upsertSavedItem.url).toEqual(
        variables.url,
      );

      const publisherQueueMessages = await getSqsMessages(
        config.aws.sqs.publisherQueue.url,
      );
      expect(publisherQueueMessages?.Messages[0]?.Body).not.toBeNull();
      const publisherQueueMessageBody = JSON.parse(
        publisherQueueMessages?.Messages[0]?.Body,
      );
      expect(publisherQueueMessageBody.action).toEqual(SQSEvents.ADD_ITEM);
      expect(publisherQueueMessageBody.user_id).toEqual(1);
      expect(publisherQueueMessageBody.item_id).toEqual(25);
      expect(publisherQueueMessageBody.api_id).toEqual(0);

      const permLibQueueData = await getSqsMessages(
        config.aws.sqs.permLibItemMainQueue.url,
      );
      // Should not send for non-premium users
      expect(permLibQueueData?.Messages).toBeUndefined();
    });

    it('should push addItem event to perm lib queue for premium users', async () => {
      jest.useFakeTimers({ advanceTimers: true, now: dateNow });
      const variables = {
        url: 'http://addingtoqueue.com',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
            url
          }
        }
      `;

      const mutationResult = await request(app)
        .post(url)
        .set({ ...headers, premium: 'true' })
        .send({
          query: ADD_AN_ITEM,
          variables,
        });
      expect(mutationResult.body.data?.upsertSavedItem.url).toEqual(
        variables.url,
      );

      const permLibQueueData = await getSqsMessages(
        config.aws.sqs.permLibItemMainQueue.url,
      );
      expect(permLibQueueData?.Messages[0]?.Body).not.toBeNull();
      const permLibQueueBody = JSON.parse(permLibQueueData?.Messages[0]?.Body);
      expect(permLibQueueBody.userId).toEqual(1);
      expect(permLibQueueBody.itemId).toEqual(25);
      expect(permLibQueueBody.givenUrl).toEqual(variables.url);
      expect(permLibQueueBody.timeAdded).toEqual('2021-10-06 03:22:00');
      expect(permLibQueueBody.resolvedId).toEqual(25);
    });
    describe(' - on existing savedItem: ', () => {
      const ADD_AN_ITEM = `
        mutation addAnItem(
          $url: String!
          $isFavorite: Boolean
          $timestamp: Int
        ) {
          upsertSavedItem(
            input: { url: $url, isFavorite: $isFavorite, timestamp: $timestamp }
          ) {
            id
            url
            status
            _createdAt
            _updatedAt
            favoritedAt
            archivedAt
            isFavorite
            isArchived
          }
        }
      `;

      beforeEach(async () => {
        await writeDb('list').truncate();
        await writeDb('list').insert({
          item_id: 11,
          status: 1,
          favorite: 0,
          user_id: 1,
          resolved_id: 11,
          given_url: `http://google.com`,
          title: `don't be evil`,
          time_added: date,
          time_updated: date,
          time_read: date,
          time_favorited: date,
          api_id: 'apiid',
          api_id_updated: 'apiid',
        });
      });

      it(`should update an item already in a user's list`, async () => {
        jest.useFakeTimers({ advanceTimers: true, now: dateNow });
        const variables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        const mutationResult = await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables,
        });
        expect(mutationResult.body.errors).toBeUndefined();
        const data = mutationResult.body.data.upsertSavedItem;
        expect(data._createdAt).toEqual(getUnixTimestamp(dateNow));
        expect(data._createdAt).toEqual(data._updatedAt);
        expect(data._createdAt).toEqual(data.favoritedAt);
        expect(data.status).toEqual('UNREAD');
        expect(data.isFavorite).toBeTrue();
        expect(data.isArchived).toBeFalse();
        expect(data.archivedAt).toBeNull();
        expect(data.url).toEqual('http://google.com');
        expect(data.id).toEqual('11');
      });
      it('should not emit an add item event', async () => {
        const variables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables,
        });
        expect(eventSpy.mock.calls.length).toBeGreaterThan(0);
        const events = eventSpy.mock.calls.map((call) => call[0]);
        expect(events).not.toContain(EventType.ADD_ITEM);
      });
      it('should emit favorite event if item is favorited', async () => {
        const variables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables,
        });
        expect(eventSpy.mock.calls.length).toBeGreaterThan(0);
        const events = eventSpy.mock.calls.map((call) => call[0]);
        expect(events).toContain(EventType.FAVORITE_ITEM);
      });
      it('should not unfavorite a previously favorited item, and should not send favorite event', async () => {
        const faveVariables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        const unFaveVariables = {
          url: 'http://google.com',
          isFavorite: false,
          timestamp: getUnixTimestamp(dateNow),
        };
        // Put in a favorite item
        await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables: faveVariables,
        });
        // Start listening for events after initial insert
        eventSpy.mockClear();
        // re-add it
        const res = await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables: unFaveVariables,
        });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.upsertSavedItem.isFavorite).toBeTrue();
        expect(eventSpy).toHaveBeenCalledTimes(0);
      });
      it('should send not favorite event if item was previously favorited', async () => {
        const faveVariables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        const reFaveVariables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        // Put in a favorite item
        await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables: faveVariables,
        });
        // Start listening for events after initial insert
        eventSpy.mockClear();
        // re-add it
        const res = await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables: reFaveVariables,
        });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.upsertSavedItem.isFavorite).toBeTrue();
        expect(eventSpy).toHaveBeenCalledTimes(0);
      });
      it('should emit unarchive event if item was previously archived', async () => {
        const variables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables,
        });
        const events = eventSpy.mock.calls.map((call) => call[0]);
        expect(events).toContain(EventType.UNARCHIVE_ITEM);
      });

      it('should not emit unarchive event if item was not archived', async () => {
        await writeDb('list')
          .update({ status: 0 })
          .where({ item_id: 11, user_id: 1 });
        const variables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables,
        });
        const events = eventSpy.mock.calls.map((call) => call[0]);
        expect(events).not.toContain(EventType.UNARCHIVE_ITEM);
      });
    });
  });
  describe('sad path', function () {
    it('should return error for invalid url', async () => {
      mockParserGetItemRequest('abcde1234', {
        item: {
          given_url: 'abcde1234',
          item_id: null,
        },
      });

      const variables = {
        url: 'abcde1234',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
            url
            _createdAt
            _updatedAt
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(mutationResult.body.errors[0].message).toEqual(
        `unable to add item with url: ${variables.url}`,
      );
    });

    it('should fail to save an item shorter then 4 characters', async () => {
      const variables = {
        url: 't.y',
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!) {
          upsertSavedItem(input: { url: $url }) {
            id
           
            _createdAt
            _updatedAt
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(mutationResult).not.toBeNull();
      expect(mutationResult.body.data).toBeUndefined();
      expect(mutationResult.body.errors).not.toBeNull();

      expect(mutationResult.body.errors[0].extensions.code).toBe(
        'BAD_USER_INPUT',
      );
      expect(mutationResult.body.errors[0].extensions.field).toBe('url');
    });

    it('should return error when insertion throws error', async () => {
      mockParserGetItemRequest('http://databasetest.com', {
        item: {
          given_url: 'http://databasetest.com',
          item_id: 2,
        },
      });

      const contextStub = jest
        // @ts-expect-error ts(2345)
        .spyOn(ContextManager.prototype, 'dbClient', 'get')
        // @ts-expect-error ts(2339)
        .mockImplementation(() => {
          return (() => undefined) as Knex;
        });

      const variables = {
        url: 'http://databasetest.com',
        isFavorite: true,
      };

      const ADD_AN_ITEM = `
        mutation addAnItem($url: String!, $isFavorite: Boolean) {
          upsertSavedItem(input: { url: $url, isFavorite: $isFavorite }) {
            id
            url
            _createdAt
            _updatedAt
          }
        }
      `;

      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      contextStub.mockRestore();
      expect(mutationResult.body.errors[0].message).toEqual(
        `unable to add item with url: ${variables.url}`,
      );
    });
  });
});
