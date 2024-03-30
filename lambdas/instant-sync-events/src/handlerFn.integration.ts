import { Knex } from 'knex';
import { readClient, writeClient } from './clients';
import * as LambdaSecrets from '@pocket-tools/lambda-secrets';
import { Message, instantSyncHandler } from './handlerFn';
import { SQSRecord } from 'aws-lambda';

jest.mock('@pocket-tools/lambda-secrets');

describe('instantSyncHandler', () => {
  let writeDb: Knex;
  let readDb: Knex;

  beforeAll(async () => {
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
    writeDb = await writeClient();
    readDb = await readClient();

    writeDb('push_tokens').truncate();
    writeDb('push_tokens').insert({
      guid: 1234,
      user_id: 1,
      device_identifier: 'device1234',
      push_type: 'prod',
      platform: 'ios',
      token: 'sometokenhere',
      expires_at: new Date().getTime() / 1000 + 60 * 60 * 24,
    });

    writeDb('push_tokens').insert({
      guid: 1234,
      user_id: 2,
      device_identifier: 'device123456',
      push_type: 'prod',
      platform: 'ios',
      token: 'sometokenhere2',
      expires_at: new Date().getTime() / 1000 + 60 * 60 * 24,
    });
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
  });

  it.each([
    {
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
      expected: ['1', '2'],
    },
  ])(
    'should send sqs records for batch of users',
    async ({ input, expected }) => {
      const messages: Message[] = input;

      const records: SQSRecord[] = messages.map((message: Message) => {
        return {
          body: JSON.stringify({ Message: JSON.stringify(message) }),
        } as unknown as SQSRecord;
      });

      instantSyncHandler(records);
    },
  );
});
