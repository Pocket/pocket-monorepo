import { Knex } from 'knex';
import { readClient, writeClient } from './clients';
import * as LambdaSecrets from '@pocket-tools/lambda-secrets';
import { Message, instantSyncHandler } from './handlerFn';
import { SQSRecord } from 'aws-lambda';
import { client as sqs } from './sqs';
import { PurgeQueueCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { config } from './config';

jest.mock('@pocket-tools/lambda-secrets');

describe('instantSyncHandler', () => {
  let writeDb: Knex;
  let serverLoggerSpy: jest.SpyInstance;

  afterEach(async () => {
    await sqs.send(new PurgeQueueCommand({ QueueUrl: config.pushQueueUrl }));
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    jest.spyOn(LambdaSecrets, 'fetchSecret').mockImplementation(() => {
      return Promise.resolve({
        read_host: 'localhost',
        read_username: 'pkt_inssync_r',
        read_password: '',
        write_host: 'localhost',
        write_username: 'pkt_inssync_w',
        write_password: '',
      });
    });
    serverLoggerSpy = jest.spyOn(console, 'info');
    writeDb = await writeClient(true);
    await readClient(true);
    await writeDb('push_tokens').truncate();
  });

  it.each([
    {
      // Filters out duplicate user ids
      tokens: [
        {
          guid: 1234,
          user_id: 1,
          device_identifier: 'device1234',
          push_type: 'prod',
          platform: 'ios',
          token: 'sometokenhere',
          expires_at: new Date(new Date().getTime() + 60 * 60 * 24 * 1000),
        },
        {
          guid: 12347,
          user_id: 2,
          device_identifier: 'device123456',
          push_type: 'prod',
          platform: 'ios',
          token: 'sometokenhere2',
          expires_at: new Date(new Date().getTime() + 60 * 60 * 24 * 1000),
        },
      ],
      input: [
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdf',
              id: '1',
            },
          },
        },
        {
          'detail-type': 'DELETE_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdf',
              id: '1',
            },
          },
        },
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdasdf',
              id: '2',
            },
          },
        },
      ],
      expected: [
        { token: 'prod::sometokenhere', target: 7 },
        { token: 'prod::sometokenhere2', target: 7 },
      ],
      cleanup: 0,
    },
    {
      // Filters out expired tokens
      tokens: [
        {
          guid: 1234,
          user_id: 1,
          device_identifier: 'device1234',
          push_type: 'prod',
          platform: 'ios',
          token: 'sometokenhere',
          expires_at: new Date(new Date().getTime() - 60 * 60 * 24 * 1000),
        },
        {
          guid: 12348,
          user_id: 2,
          device_identifier: 'device123456',
          push_type: 'prod',
          platform: 'ios',
          token: 'sometokenhere2',
          expires_at: new Date(new Date().getTime() + 60 * 60 * 24 * 1000),
        },
      ],
      input: [
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdf',
              id: '1',
            },
          },
        },
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdasdf',
              id: '2',
            },
          },
        },
      ],
      expected: [{ token: 'prod::sometokenhere2', target: 7 }],
      cleanup: 1,
    },
    {
      // Returns all tokens for a user
      tokens: [
        {
          guid: 12347,
          user_id: 2,
          device_identifier: 'device1234',
          push_type: 'prod',
          platform: 'ios',
          token: 'sometokenhere',
          expires_at: new Date(new Date().getTime() + 60 * 60 * 24 * 1000),
        },
        {
          guid: 1234,
          user_id: 2,
          device_identifier: 'device123456',
          push_type: 'prod',
          platform: 'ios',
          token: 'sometokenhere2',
          expires_at: new Date(new Date().getTime() + 60 * 60 * 24 * 1000),
        },
      ],
      input: [
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdf',
              id: '1',
            },
          },
        },
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdasdf',
              id: '2',
            },
          },
        },
      ],
      expected: [
        { token: 'prod::sometokenhere', target: 7 },
        { token: 'prod::sometokenhere2', target: 7 },
      ],
      cleanup: 0,
    },
    {
      // Works for android and ios
      tokens: [
        {
          guid: 12347,
          user_id: 2,
          device_identifier: 'device1234',
          push_type: 'prod',
          platform: 'android',
          token: 'sometokenhere',
          expires_at: new Date(new Date().getTime() + 60 * 60 * 24 * 1000),
        },
        {
          guid: 1234,
          user_id: 1,
          device_identifier: 'device123456',
          push_type: 'prod',
          platform: 'ios',
          token: 'sometokenhere2',
          expires_at: new Date(new Date().getTime() + 60 * 60 * 24 * 1000),
        },
      ],
      input: [
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdf',
              id: '1',
            },
          },
        },
        {
          'detail-type': 'ADD_ITEM',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdasdf',
              id: '2',
            },
          },
        },
      ],
      expected: [
        { token: 'prod::sometokenhere', target: 5 },
        { token: 'prod::sometokenhere2', target: 7 },
      ],
      cleanup: 0,
    },
  ])(
    'should send sqs records for batch of users',
    async ({ tokens, input, expected, cleanup }) => {
      await writeDb('push_tokens').insert(tokens);
      const messages: Message[] = input;

      const records: SQSRecord[] = messages.map((message: Message) => {
        return {
          body: JSON.stringify({ Message: JSON.stringify(message) }),
        } as unknown as SQSRecord;
      });

      const failures = await instantSyncHandler(records);
      expect(failures.batchItemFailures.length).toBe(0);

      const sqsResponse = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: config.pushQueueUrl,
          MaxNumberOfMessages: 10,
        }),
      );
      const sentTokens = sqsResponse.Messages?.map(
        (message) => JSON.parse(message.Body!).recipient,
      );

      const sentTargets = sqsResponse.Messages?.map(
        (message) => JSON.parse(message.Body!).target,
      );

      expect(sentTokens).toStrictEqual(
        expected.map((expectedBody) => expectedBody.token),
      );

      expect(sentTargets).toStrictEqual(
        expected.map((expectedBody) => expectedBody.target),
      );

      expect(serverLoggerSpy).toHaveBeenLastCalledWith(
        `Cleaning up ${cleanup}`,
      );
    },
  );
});
