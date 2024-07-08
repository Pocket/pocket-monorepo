import { receiveMessage, purgeQueue } from '../../sqs';
import { config } from '../../config';
import { seedDb } from '../../test/utils/saveSeeder';
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
      const messageBodies = backfillMessages.Messages.map((message) =>
        JSON.parse(message.Body),
      );
      const messageKeyMatcher = {
        userItems: [
          {
            userId: expect.toBeNumber(),
            itemIds: expect.toBeArray(),
          },
        ],
      };
      expect(messageBodies).toEqual(Array(3).fill(messageKeyMatcher));
      const itemsPerMessage = messageBodies.map(
        (body) => body.userItems[0].itemIds.length,
      );
      // 2001 items should be chunked into 3 payloads
      expect(itemsPerMessage).toIncludeSameMembers([1000, 1000, 1]);
      // Ordering doesn't matter, but all ids should be present when combined
      const combinedIdPayloads = messageBodies.flatMap(
        (body) => body.userItems[0].itemIds,
      );
      expect(combinedIdPayloads).toIncludeSameMembers(
        // numbers 1-2001
        Array.from(Array(2001), (_, i) => i + 1),
      );
      await purgeQueue(config.aws.sqs.userItemsUpdateUrl);
    }
  }, 2000000);
});
