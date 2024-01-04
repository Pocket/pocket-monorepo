import { writeClient } from '../../../database/client';
import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import nock from 'nock';
import config from '../../../config';
import {
  EventType,
  ItemsEventEmitter,
  SQSEvents,
  SqsListener,
} from '../../../businessEvents';
import {
  QueueAttributeName,
  ReceiveMessageCommand,
  ReceiveMessageCommandInput,
  ReceiveMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { sqs } from '../../../aws/sqs';
import sinon from 'sinon';
import { getUnixTimestamp } from '../../../utils';
import { transformers } from '../../../businessEvents/sqs/transformers';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

chai.use(chaiDateTime);

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
  const db = writeClient();
  const itemsEventEmitter = new ItemsEventEmitter();
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');
  new SqsListener(itemsEventEmitter, transformers);
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const unixDate = getUnixTimestamp(date);
  const dateNow = new Date('2021-10-06 03:22:00');
  const headers = { userid: '1' };
  let clock;
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    clock = sinon.useFakeTimers({
      now: dateNow,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
    });
  });

  afterAll(async () => {
    await db.destroy();
    clock.restore();
    sinon.restore();
    nock.cleanAll();
    await server.stop();
  });

  afterEach(() => eventSpy.resetHistory());

  beforeEach(async () => {
    await sqs.purgeQueue({ QueueUrl: config.aws.sqs.publisherQueue.url });
    await sqs.purgeQueue({ QueueUrl: config.aws.sqs.permLibItemMainQueue.url });
    await db('item_tags').truncate();
    await db('list').truncate();
    await db('item_tags').insert([
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
      expect(mutationResult).is.not.null;
      const data = mutationResult.body.data?.upsertSavedItem;
      expect(data.id).to.equal('8');
      expect(data.title).to.equal(variables.url);
      expect(data.url).to.equal(variables.url);
      expect(data.isFavorite).is.false;
      expect(data.isArchived).is.false;
      expect(data._deletedAt).is.null;
      expect(data._version).is.null;
      expect(data.item.givenUrl).equals(variables.url);
      expect(data.tags[0].name).equals('zebra');
      expect(data.archivedAt).is.null;
      expect(data.favoritedAt).is.null;
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
      expect(mutationResult).is.not.null;
      const data = mutationResult.body.data?.upsertSavedItem;
      expect(data.title).to.equal(variables.title);
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
      expect(mutationResult).is.not.null;
      const data = mutationResult.body.data?.upsertSavedItem;
      expect(data.id).to.equal('1');
      expect(data.item.givenUrl).is.undefined;
      expect(data.item.url).to.equal(givenUrl);
      expect(data.item.itemId).to.equal('1');
      expect(data.item.__typename).to.equal('PendingItem');
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
      expect(mutationResult).is.not.null;
      const data = mutationResult.body.data?.upsertSavedItem;

      expect(data.id).to.equal('11');
      expect(data.url).to.equal(variables.url);
      expect(data.isFavorite).is.true;
      expect(data.isArchived).is.false;
      expect(data.archivedAt).is.null;
      expect(data._createdAt).to.equal(unixDate);
      expect(data.favoritedAt).to.equal(unixDate);
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

      expect(data.url).equals('http://favorite.com');
      expect(data.isFavorite).is.true;
      expect(data.favoritedAt).to.not.equal(
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

      expect(eventSpy.calledOnce).to.be.true;
      const eventData = eventSpy.getCall(0).args;
      expect(eventData[0]).to.equal(EventType.ADD_ITEM);
      expect(eventData[1].url).to.equal(variables.url);
      expect(mutationResult.body.data?.upsertSavedItem.url).to.equal(
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
      eventSpy.resetHistory();
      const mutationResult = await request(app).post(url).set(headers).send({
        query: ADD_AN_ITEM,
        variables,
      });
      expect(eventSpy.callCount).to.equal(0);
      expect(mutationResult.body.data?.upsertSavedItem.url).to.equal(
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
      expect(mutationResult.body.data?.upsertSavedItem.url).to.equal(
        variables.url,
      );

      const publisherQueueMessages = await getSqsMessages(
        config.aws.sqs.publisherQueue.url,
      );
      expect(publisherQueueMessages?.Messages[0]?.Body).is.not.null;
      const publisherQueueMessageBody = JSON.parse(
        publisherQueueMessages?.Messages[0]?.Body,
      );
      expect(publisherQueueMessageBody.action).equals(SQSEvents.ADD_ITEM);
      expect(publisherQueueMessageBody.user_id).equals(1);
      expect(publisherQueueMessageBody.item_id).equals(25);
      expect(publisherQueueMessageBody.api_id).equals(0);

      const permLibQueueData = await getSqsMessages(
        config.aws.sqs.permLibItemMainQueue.url,
      );
      // Should not send for non-premium users
      expect(permLibQueueData?.Messages).is.empty;
    });

    it('should push addItem event to perm lib queue for premium users', async () => {
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
      expect(mutationResult.body.data?.upsertSavedItem.url).to.equal(
        variables.url,
      );

      const permLibQueueData = await getSqsMessages(
        config.aws.sqs.permLibItemMainQueue.url,
      );
      expect(permLibQueueData?.Messages[0]?.Body).is.not.null;
      const permLibQueueBody = JSON.parse(permLibQueueData?.Messages[0]?.Body);
      expect(permLibQueueBody.userId).equals(1);
      expect(permLibQueueBody.itemId).equals(25);
      expect(permLibQueueBody.givenUrl).equals(variables.url);
      expect(permLibQueueBody.timeAdded).equals('2021-10-06 03:22:00');
      expect(permLibQueueBody.resolvedId).equals(25);
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
        await db('list').truncate();
        await db('list').insert({
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
        const variables = {
          url: 'http://google.com',
          isFavorite: true,
          timestamp: getUnixTimestamp(dateNow),
        };
        const mutationResult = await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables,
        });
        expect(mutationResult.body.errors).to.be.undefined;
        const data = mutationResult.body.data.upsertSavedItem;
        expect(data._createdAt)
          .to.equal(getUnixTimestamp(dateNow))
          .and.to.equal(data._updatedAt)
          .and.to.equal(data.favoritedAt);
        expect(data.status).to.equal('UNREAD');
        expect(data.isFavorite).to.be.true;
        expect(data.isArchived).to.be.false;
        expect(data.archivedAt).to.be.null;
        expect(data.url).to.equal('http://google.com');
        expect(data.id).to.equal('11');
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
        expect(eventSpy.callCount).to.be.greaterThan(0);
        const events = eventSpy.getCalls().map((call) => call.args[0]);
        expect(events).not.to.contain(EventType.ADD_ITEM);
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
        expect(eventSpy.callCount).to.be.greaterThan(0);
        const events = eventSpy.getCalls().map((call) => call.args[0]);
        expect(events).to.contain(EventType.FAVORITE_ITEM);
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
        eventSpy.resetHistory();
        // re-add it
        const res = await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables: unFaveVariables,
        });
        expect(res.body.errors).to.be.undefined;
        expect(res.body.data.upsertSavedItem.isFavorite).to.be.true;
        expect(eventSpy.callCount).to.equal(0);
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
        eventSpy.resetHistory();
        // re-add it
        const res = await request(app).post(url).set(headers).send({
          query: ADD_AN_ITEM,
          variables: reFaveVariables,
        });
        expect(res.body.errors).to.be.undefined;
        expect(res.body.data.upsertSavedItem.isFavorite).to.be.true;
        expect(eventSpy.callCount).to.equal(0);
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
        const events = eventSpy.getCalls().map((call) => call.args[0]);
        expect(events).to.contain(EventType.UNARCHIVE_ITEM);
      });

      it('should not emit unarchive event if item was not archived', async () => {
        await db('list')
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
        const events = eventSpy.getCalls().map((call) => call.args[0]);
        expect(events).not.to.contain(EventType.UNARCHIVE_ITEM);
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
      expect(mutationResult.body.errors[0].message).equals(
        `unable to add item with url: ${variables.url}`,
      );
    });
    it('should return error when insertion throws error', async () => {
      mockParserGetItemRequest('http://databasetest.com', {
        item: {
          given_url: 'http://databasetest.com',
          item_id: 2,
        },
      });

      const contextStub = sinon
        .stub(ContextManager.prototype, 'dbClient')
        .returns(undefined);

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
      contextStub.restore();
      expect(mutationResult.body.errors[0].message).equals(
        `unable to add item with url: ${variables.url}`,
      );
    });
  });
});
