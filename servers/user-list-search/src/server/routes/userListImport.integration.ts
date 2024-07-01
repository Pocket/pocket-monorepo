import { receiveMessage, purgeQueue } from '../../sqs';
import { config } from '../../config';
import { seedDb, getArrayOfIds } from '../../test/utils/saveSeeder';
import { Application } from 'express';
import { ContextManager } from '../context';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { startServer } from '../serverUtils';
import {
  contentDb,
  knexDbReadClient,
} from '../../datasource/clients/knexClient';
import { client } from '../../datasource/elasticsearch';

describe('User List Import User Search Processor', () => {
  let server: ApolloServer<ContextManager>;
  let app: Application;

  afterAll(async () => {
    await server.stop();
    client.close();
    knexDbReadClient().destroy();
    contentDb().destroy();
    jest.resetAllMocks();
  });

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });

  it('loads a user list and pushes to next queue', async () => {
    //Reset the db and the queues
    await Promise.all([
      seedDb({
        truncate: true,
        userCount: 2,
        listCount: 2001,
        tagCount: 5,
        forcePremium: true,
      }),
      purgeQueue(config.aws.sqs.userItemsUpdateUrl),
    ]);

    for (const userId of [1, 2]) {
      const res = await request(app)
        .post('/userListImport')
        .send({ userId, backfill: false });
      expect(res.status).toBe(200);

      //Request the expected 6 messages from the queue
      const backfillMessages = await receiveMessage(
        config.aws.sqs.userItemsUpdateUrl,
        {
          QueueUrl: config.aws.sqs.userItemsUpdateUrl,
          MaxNumberOfMessages: 3,
        },
      );

      expect(backfillMessages.Messages).toBeArrayOfSize(3);

      //Verify each message has the expected results.
      expect(JSON.parse(backfillMessages.Messages[0].Body)).toStrictEqual({
        userItems: [
          { userId, itemIds: getArrayOfIds(1000).map((item) => item.itemId) },
        ],
      });

      expect(JSON.parse(backfillMessages.Messages[1].Body)).toStrictEqual({
        userItems: [
          {
            userId,
            itemIds: getArrayOfIds(1000, 1001).map((item) => item.itemId),
          },
        ],
      });

      expect(JSON.parse(backfillMessages.Messages[2].Body)).toStrictEqual({
        userItems: [
          {
            userId,
            itemIds: getArrayOfIds(1, 2001).map((item) => item.itemId),
          },
        ],
      });

      await purgeQueue(config.aws.sqs.userItemsUpdateUrl);
    }
  }, 2000000);
});
