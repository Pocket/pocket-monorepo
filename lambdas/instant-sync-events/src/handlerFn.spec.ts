import { SQSRecord } from 'aws-lambda';
import { Message, filterUserIds } from './handlerFn';

describe('filterUserIds', () => {
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
          source: 'filter-me-out',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdasdf',
              id: '2',
            },
          },
        },
      ],
      expected: ['1'],
    },
    {
      input: [
        {
          'detail-type': 'DONT_ADD_ME',
          source: 'list-api',
          detail: {
            user: {
              hashedGuid: '123sdfkjlkjslgasdf',
              id: '1',
            },
          },
        },
        {
          'detail-type': 'DONT_ADD_ME_EITHER',
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
      expected: ['2'],
    },
  ])(
    'should dedupe and filter ids from a batch of records',
    async ({ input, expected }) => {
      const messages: Message[] = input;

      const records: SQSRecord[] = messages.map((message: Message) => {
        return {
          body: JSON.stringify({ Message: JSON.stringify(message) }),
        } as unknown as SQSRecord;
      });

      const userIds = filterUserIds(records);
      expect(userIds).toStrictEqual(expected);
    },
  );
});
