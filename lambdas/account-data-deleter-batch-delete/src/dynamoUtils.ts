import { config } from './config';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  DynamoDBDocumentClient,
  ScanCommandInput,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { chunk } from 'lodash';
import { setTimeout } from 'timers/promises';
import * as Sentry from '@sentry/aws-serverless';

export class BatchDeleteDyanmoClient {
  private dynamo: DynamoDBDocumentClient;

  constructor(client: DynamoDBClient) {
    this.dynamo = DynamoDBDocumentClient.from(client);
  }

  /**
   * Fetch a batch of userIds to delete. Scan the first n rows in the index.
   * NOTE: DynamoDB is limited to a 16 MB payload size. Normally I would bake in
   * the logic for continuing to request if that payload size is exceeded. However,
   * 1 MB of ints is a large amount and we won't be fetching that much. The whole
   * data set is ~400k rows which is like 4 MB.
   * I can't see this ever changing for this one-time use case, but... update it
   * if you need to.
   * @param limit the size to limit the result set
   */
  public async getBatch(limit: number): Promise<number[]> {
    const command: ScanCommandInput = {
      TableName: config.dynamo.pendingUsers.tableName,
      Limit: limit,
    };
    const res = await this.dynamo.send(new ScanCommand(command));
    if (res.Items == null) return [];
    return res.Items?.map(
      (item) => item[config.dynamo.pendingUsers.keyColumn] as any as number, // I know... but it's defined in the schema
    );
  }

  /**
   * Given a list of userIds (sourced from the HistoricalDeletedUsers-Pending
   * table), delete them from the Pending table and add them to
   * HistoricalDeletedUsers-Processed table.
   * This is for record-keeping after the user ids are submitted for
   * deletion (and also to remove them from being deleted again).
   *
   * This top-level method chunks the list of userIds into batches that
   * conform to DynamoDB BatchWriteItem limits (<=25 requests), then
   * calls a helper function to perform the actual function logic.
   * @param userIds list of userIds from HistoricalDeletedUsers-Pending
   * table that should be moved to HistoricalDeletedUsers-Processed table.
   */
  public async moveBatch(userIds: number[]) {
    // DynamoDB you can only have 25 requests per BatchWriteItem command
    // 2 requests per ID, so max IDs can process is 12 (25 // 2)
    const chunkedIds = chunk(userIds, config.dynamo.maxBatchSize);
    for await (const ids of chunkedIds) {
      await this._moveBatch(ids);
      // Short delay between requests
      await setTimeout(100);
    }
  }

  /**
   * Helper function for moveBatch; make DynamoDB requests for
   * moving userIds from the -Pending table to the -Processed
   * table.
   * @param userIds list of userIds from HistoricalDeletedUsers-Pending
   * table that should be moved to HistoricalDeletedUsers-Processed table,
   * previously chunked to conform to DynamoDB request size limits.
   */
  async _moveBatch(userIds: number[]) {
    // in DynamoDb you have to tag every request with its type
    // in BatchWriteItem api; Delete & Put are separate
    // Here we delete from one table and put into another,
    // so all deletes and puts can be grouped
    const { deleteRequests, putRequests } = userIds.reduce(
      (req, id) => {
        req.deleteRequests.push({
          DeleteRequest: {
            Key: {
              [config.dynamo.pendingUsers.keyColumn]: id,
            },
          },
        });
        req.putRequests.push({
          PutRequest: {
            Item: {
              [config.dynamo.processedUsers.keyColumn]: id,
              createdAt: new Date().toISOString(),
            },
          },
        });
        return req;
      },
      {
        deleteRequests: [],
        putRequests: [],
      } as {
        deleteRequests: { DeleteRequest: { Key: { [x: string]: number } } }[];
        putRequests: {
          PutRequest: { Item: { [x: string]: number | string } };
        }[];
      },
    );

    const command: BatchWriteCommandInput = {
      RequestItems: {
        [config.dynamo.pendingUsers.tableName]: deleteRequests,
        [config.dynamo.processedUsers.tableName]: putRequests,
      },
    };
    // Sigh. One day I'll publish my library to nicely handle
    // dynamo requests... but for now just make an assumption
    // that this incredibly small and low rate will not butt
    // up against limits; dump any unprocessed items if have to
    // and send error to Sentry
    const res = await this.dynamo.send(new BatchWriteCommand(command));
    if (
      res.UnprocessedItems != null &&
      JSON.stringify(res.UnprocessedItems) !== '{}' // I hate Javascript
    ) {
      Sentry.captureException(
        'Unprocessed keys detected when moving historical deleted user batch',
      );
      console.log(
        `Error: Unprocessed Keys Detected:\n\n${JSON.stringify(
          res.UnprocessedItems,
        )}`,
      );
    }
  }
}
