import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import config from '../config';
import * as Sentry from '@sentry/node';
import { ItemSummary } from '../__generated__/resolvers-types';
import md5 from 'md5';

export interface IItemSummaryDataStore {
  getStoredItemSummary(resolvedUrl: string): Promise<ItemSummaryEntity | null>;
  storeItemSummary(input: ItemSummaryEntity): Promise<ItemSummaryEntity>;
}

export type ItemSummaryEntity = ItemSummary & {
  urlHash: string; // md5 hash of the resolved Url
  createdAt: number; // epoch time in seconds
  source: string; // class name of the datasource
};

// Create an array of the key names to be used in the projection expression.
// Because typescript erases types at runtime we need to build this manually
// but we can use a keyof type to ensure we have compile time safety and include all keys
const itemSummaryEntityKeys: (keyof ItemSummaryEntity)[] = [
  'urlHash',
  'id',
  'image',
  'excerpt',
  'title',
  'authors',
  'domain',
  'datePublished',
  'url',
  'createdAt',
];

export class ItemSummaryDataStoreBase implements IItemSummaryDataStore {
  public static table = config.dynamoDb.itemSummaryTable;

  constructor(public conn: DynamoDBDocumentClient) {}
  /**
   * Fetch a share by ID from DynamoDB table
   * @param id the lookup ID (hash key)
   * @returns ShareEntity, or null if record does not exist
   */
  async getStoredItemSummary(
    resolvedUrl: string,
  ): Promise<ItemSummaryEntity | null> {
    const getPreviewCommand = new GetCommand({
      TableName: ItemSummaryDataStoreBase.table.name,
      Key: { urlHash: md5(resolvedUrl) },
      ProjectionExpression: itemSummaryEntityKeys.join(','),
    });
    const response = await this.conn.send(getPreviewCommand);
    if (response?.Item != null) {
      return response.Item as ItemSummaryEntity;
    }
    return null;
  }

  async storeItemSummary(input: ItemSummaryEntity): Promise<ItemSummaryEntity> {
    const ttl = Math.round(
      (Date.now() + config.dynamoDb.itemSummaryTable.ttl) / 1000,
    );
    const putCommand = new PutCommand({
      Item: { ...input, ttl },
      TableName: ItemSummaryDataStoreBase.table.name,
    });
    const response = await this.conn.send(putCommand);
    if (response?.$metadata.httpStatusCode !== 200) {
      Sentry.addBreadcrumb({ data: response.$metadata });
      throw new Error('Failed to store item summary record');
    }
    return input;
  }
}
