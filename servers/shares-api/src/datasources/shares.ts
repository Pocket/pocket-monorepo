import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config';
import {
  AuthenticationError,
  ForbiddenError,
} from '@pocket-tools/apollo-utils';
import * as Sentry from '@sentry/node';
import { UserContext } from '../models/UserContext';

export type ShareEntity = {
  shareId: string;
  note?: string;
  highlights?: string[];
  targetUrl: string;
  createdAt: number; // epoch time in seconds
};

export type CreateShareEntity = ShareEntity & {
  userId?: string;
  guid?: string;
};

export interface ISharesDataSource {
  getShare(id: string): Promise<ShareEntity | null>;
  createShare(
    input: CreateShareEntity,
  ):
    | Promise<ShareEntity>
    | Promise<AuthenticationError>
    | Promise<ForbiddenError>;
  updateShareContext(
    shareId: string,
    context: Pick<ShareEntity, 'note' | 'highlights'>,
    owner: { key: keyof UserContext; value: string },
  ):
    | Promise<ShareEntity | null>
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
  async updateShareContext(
    shareId: string,
    context: Pick<ShareEntity, 'note' | 'highlights'>,
    owner: { key: keyof UserContext; value: string },
  ): Promise<AuthenticationError> {
    return new AuthenticationError(
      'You must be logged in to update Share links',
    );
  }
  async createShare(input: CreateShareEntity): Promise<AuthenticationError> {
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
  async updateShareContext(
    shareId: string,
    context: Pick<ShareEntity, 'note' | 'highlights'>,
    owner: { key: keyof UserContext; value: string },
  ): Promise<ForbiddenError> {
    return new ForbiddenError('Only Native Pocket Apps may create Share links');
  }
  async createShare(input: CreateShareEntity): Promise<ForbiddenError> {
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
  async createShare(input: CreateShareEntity): Promise<ShareEntity> {
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
  /**
   * Update the context added to a share (the highlighted quotes or note).
   * Overrwrites existing data if it exists.
   * Requires that the owner matches the value stored in the database
   * referenced by the passed owner key (e.g. guid).
   * The calling function should ensure that at least one key in
   * the `context` argument exists and contains data (not null/undefined).
   * Otherwise this function will fail.
   * @param shareId the key of the share to update
   * @param context the context to attach to the share (quotes, note)
   * @param owner owner object - the key to check (i.e. userId/guid) and
   * the value to check equality against
   * @returns the updated ShareEntity if successful, otherwise null
   */
  async updateShareContext(
    shareId: string,
    context: Pick<ShareEntity, 'note' | 'highlights'>,
    owner: { key: keyof UserContext; value: string },
  ): Promise<ShareEntity | null> {
    const noteUpdate = context.note ? 'note = :note' : '';
    const highlightUpdate = context.highlights
      ? 'highlights = :highlights'
      : '';
    const updates = [noteUpdate, highlightUpdate].filter(Boolean).join(', ');
    const UpdateExpression = `SET ${updates}`;
    const update = new UpdateCommand({
      Key: { shareId },
      UpdateExpression,
      ConditionExpression: `attribute_exists(shareId) and attribute_exists(${owner.key}) and ${owner.key} = :${owner.key}`,
      ExpressionAttributeValues: {
        [`:${owner.key}`]: owner.value,
        ':note': context.note,
        ':highlights': context.highlights,
      },
      ReturnValues: 'ALL_NEW',
      TableName: SharesDataSourceAuthenticated.table.name,
    });
    try {
      const response = await this.conn.send(update);
      if (response?.Attributes != null) {
        return response.Attributes as ShareEntity;
      }
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return null;
      } else {
        Sentry.addBreadcrumb({ data: err.$metadata });
        Sentry.captureException(err);
        throw new Error('Failed to update share record');
      }
    }
    return null;
  }
}
