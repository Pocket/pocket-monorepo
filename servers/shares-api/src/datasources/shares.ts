import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config';
import {
  AuthenticationError,
  ForbiddenError,
} from '@pocket-tools/apollo-utils';
import * as Sentry from '@sentry/node';

export type ShareEntity = {
  shareId: string;
  note?: string;
  highlights?: string[];
  targetUrl: string;
  createdAt: number; // epoch time in seconds
};

export interface ISharesDataSource {
  getShare(id: string): Promise<ShareEntity | null>;
  createShare(
    input: ShareEntity,
  ):
    | Promise<ShareEntity>
    | Promise<AuthenticationError>
    | Promise<ForbiddenError>;
}

class SharesDataSourceBase {
  public static table = config.dynamoDb.sharesTable;

  constructor(public conn: DynamoDBDocumentClient) {}
  /**
   * Fetch a share by ID from DynamoDB table
   * @param id the lookup ID (hash key)
   * @returns ShareEntity, or null if record does not exist
   */
  async getShare(id: string): Promise<ShareEntity | null> {
    const getShareCommand = new GetCommand({
      TableName: SharesDataSourceBase.table.name,
      Key: { shareId: id },
      ProjectionExpression: [
        'note',
        'highlights',
        'targetUrl',
        'createdAt',
        'shareId',
      ].join(','),
    });
    const response = await this.conn.send(getShareCommand);
    if (response?.Item != null) {
      return response.Item as ShareEntity;
    }
    return null;
  }
}

/**
 * A read-only data source for unauthenticated or anonymous
 * Pocket users.
 */
export class SharesDataSourceUnauthenticated
  extends SharesDataSourceBase
  implements ISharesDataSource
{
  constructor(conn: DynamoDBDocumentClient) {
    super(conn);
  }
  async createShare(input: ShareEntity): Promise<AuthenticationError> {
    return new AuthenticationError(
      'You must be logged in to create Share links',
    );
  }
}

export class SharesDataSourceNonNativeApp
  extends SharesDataSourceBase
  implements ISharesDataSource
{
  constructor(conn: DynamoDBDocumentClient) {
    super(conn);
  }
  async createShare(input: ShareEntity): Promise<ForbiddenError> {
    return new ForbiddenError('Only Native Pocket Apps may create Share links');
  }
}

/**
 * A read-write data source for authenticated Pocket accounts.
 */
export class SharesDataSourceAuthenticated
  extends SharesDataSourceBase
  implements ISharesDataSource
{
  constructor(conn: DynamoDBDocumentClient) {
    super(conn);
  }
  /**
   * Create a new share link record
   * @param input ShareEntity the entity to insert
   * @returns the inserted entity
   * @throws error if request failed (did not return 200 status)
   */
  async createShare(input: ShareEntity): Promise<ShareEntity> {
    const ttl = Math.round(
      (Date.now() + config.dynamoDb.sharesTable.ttl) / 1000,
    );
    const putCommand = new PutCommand({
      Item: { ...input, ttl },
      TableName: SharesDataSourceAuthenticated.table.name,
    });
    const response = await this.conn.send(putCommand);
    if (response?.$metadata.httpStatusCode !== 200) {
      Sentry.addBreadcrumb({ data: response.$metadata });
      throw new Error('Failed to create share record');
    }
    return input;
  }
}
