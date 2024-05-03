import { gql } from 'graphql-tag';
import { BatchWriteCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';
import config from '../../config/index.js';
import Chance from 'chance';

export const GET_NOTES = gql`
  query GetHighlights($itemId: ID) {
    _entities(representations: { id: $itemId, __typename: "SavedItem" }) {
      ... on SavedItem {
        annotations {
          highlights {
            id
            note {
              _createdAt
              _updatedAt
              text
            }
          }
        }
      }
    }
  }
`;

export const noteSeedCommand = (now: Date): PutCommand => {
  const ms = Math.round(now.getTime() / 1000);
  return new PutCommand({
    TableName: config.dynamoDb.notesTable.name,
    Item: {
      [config.dynamoDb.notesTable.key]: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
      [config.dynamoDb.notesTable.note]: `there you have it, that's great`,
      [config.dynamoDb.notesTable._createdAt]: ms,
      [config.dynamoDb.notesTable._updatedAt]: ms,
      [config.dynamoDb.notesTable.userId]: '1',
    },
  });
};

export function* batchWriteMockNotes(
  count: number,
  userId: string,
): Generator<BatchWriteCommandInput> {
  const chance = new Chance();
  const batchSize = 25;
  let index = 0;
  const putRequests: any[] = Array(batchSize);
  while (index < count) {
    putRequests[index % batchSize] = {
      PutRequest: {
        Item: {
          [config.dynamoDb.notesTable.key]: chance.guid(),
          [config.dynamoDb.notesTable.note]: chance.sentence({
            words: chance.integer({ min: 4, max: 12 }),
          }),
          [config.dynamoDb.notesTable._createdAt]: chance.natural({
            max: 1000000,
          }),
          [config.dynamoDb.notesTable._updatedAt]: chance.natural({
            max: 1000000,
          }),
          [config.dynamoDb.notesTable.userId]: userId,
        },
      },
    };
    index += 1;
    if (index % batchSize === 0) {
      yield {
        RequestItems: { [config.dynamoDb.notesTable.name]: putRequests },
      };
    }
  }
  // If the count doesn't evenly divide with batch size, yield what we have  left
  const leftover = index % batchSize;
  if (leftover) {
    yield {
      RequestItems: {
        [config.dynamoDb.notesTable.name]: putRequests.slice(0, leftover),
      },
    };
  }
}
