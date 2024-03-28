import { SQSRecord } from 'aws-lambda';
import { Message, instantSyncHandler } from './handlerFn';

describe('instantSyncHandler', () => {
  it('should dedupe userids from a batch of records', async () => {
    const messages: Message[] = [
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
      ,
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
    ];

    const records: SQSRecord[] = messages.map((message: Message) => {
      return { body: JSON.stringify(message) };
    });

    instantSyncHandler(records);
  });
});
