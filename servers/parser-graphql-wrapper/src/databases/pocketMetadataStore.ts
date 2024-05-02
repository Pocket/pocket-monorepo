import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import config from '../config';
import * as Sentry from '@sentry/node';
import {
  PocketMetadata,
  PocketMetadataSource,
} from '../__generated__/resolvers-types';
import md5 from 'md5';

export interface IPocketMetadataDataStore {
  getStoredPocketMetadata(
    resolvedUrl: string,
    version: number,
    source: PocketMetadataSource,
  ): Promise<PocketMetadataEntity | null>;
  storePocketMetadata(
    input: PocketMetadataEntity,
    ttl: number,
  ): Promise<PocketMetadataEntity>;
}

export type PocketMetadataEntity = Omit<
  PocketMetadata,
  'createdAt' | 'datePublished'
> & {
  urlHash: string; // md5 hash of the resolved Url
  createdAt: number; // epoch time in seconds
  datePublished: number; // epoch time in seconds
  version: number;
  __typename: string;
};

export class ItemSummaryDataStoreBase implements IPocketMetadataDataStore {
  public static table = config.dynamoDb.itemSummaryTable;

  constructor(public conn: DynamoDBDocumentClient) {}
  /**
   * Fetch a share by ID from DynamoDB table
   * @param id the lookup ID (hash key)
   * @returns ShareEntity, or null if record does not exist
   */
  async getStoredPocketMetadata(
    resolvedUrl: string,
    version: number,
    source: PocketMetadataSource,
  ): Promise<PocketMetadataEntity | null> {
    const getPreviewCommand = new QueryCommand({
      TableName: ItemSummaryDataStoreBase.table.name,
      KeyConditionExpression: `urlHash = :key`,
      FilterExpression: `version = :version`,
      ExpressionAttributeValues: {
        ':key': md5(resolvedUrl),
        ':version': version,
      },
    });
    const response = await this.conn.send(getPreviewCommand);

    const items: PocketMetadataEntity[] = response.Items.filter(
      (item: PocketMetadataEntity) => {
        // source is a reserved keyword in dynamo and we want to project all values,
        // so we just filter after instead of filtering at the dynamodb level
        return item.source == source;
      },
    ) as PocketMetadataEntity[];
    if (items != null && items.length > 0) {
      return items[0];
    }
    return null;
  }

  async storePocketMetadata(
    input: PocketMetadataEntity,
    ttl: number,
  ): Promise<PocketMetadataEntity> {
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
