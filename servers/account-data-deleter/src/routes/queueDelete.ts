import { Request, Response, Router } from 'express';
import { checkSchema } from 'express-validator';
import { validate } from './validator';
import * as Sentry from '@sentry/node';
import { config } from '../config';
import {
  SendMessageBatchCommand,
  SendMessageBatchCommandOutput,
  SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { sqs } from '../aws/sqs';
import {
  AccountDeleteDataService,
  TablePrimaryKeyModel,
} from '../dataService/accountDeleteDataService';
import { nanoid } from 'nanoid';
import { readClient } from '../dataService/clients';
import { accountDeleteSchema } from './schemas';
import { serverLogger } from '@pocket-tools/ts-logger';

export type SqsMessage = {
  userId: number;
  email: string;
  isPremium: boolean;
  primaryKeyValues: any[][];
  primaryKeyNames: string[];
  tableName: string;
  traceId: string;
};

const router = Router();

/**
 * this endpoint will be called by the account-delete event consumer lambda.
 * we batch the primary key column_name and primary key values
 * to a sqs message, which later would be picked up by /batchDelete endpoint for deleting the PII.
 */
router.post(
  '/',
  checkSchema(accountDeleteSchema),
  validate,
  (req: Request, res: Response) => {
    const requestId = req.body.traceId ?? nanoid();
    enqueueTablesForDeletion(
      req.body,
      new AccountDeleteDataService(req.body.userId, readClient()),
      requestId,
      config.queueDelete.tableNames,
    );
    return res.send({
      status: 'OK',
      message: `received message body ${JSON.stringify(
        req.body,
      )} (requestId='${requestId}')`,
    });
  },
);

/**
 * Enqueue primary key of the tables for deletions in batches.
 * This function is called in the router.POST /queueDelete endpoint. In this module,
 * we are reading tables from config.queueDelete.tableName, and for every table
 * we retrieve the list of primary key of that table and batch them into a sqs message.
 * max no of primary key in a single sqs message is set in config.queueDelete.queueLimit.
 * max no of sqs message in a single sqs batch is set in config.aws.sqs.batchSize
 * Since the data to clear could be large, we don't want to keep the api
 * connection open while it's happening. Instead the generation of the sqs messages
 * will happen asynchronously in the background.
 * @param data /queueDeletePOST request body
 * @param accountDeleteDataService databaseService that connects with main db for reading tables
 * @param requestId request Id of the /queueDelete endpoint
 * @param tables map of table name to the column that should be used to limit the query
 * selection ('where')
 * @throws Error if table map `where` column is not one of user_id or a string like %email%.
 */
export async function enqueueTablesForDeletion(
  data: Omit<SqsMessage, 'primaryKeyValues' | 'tableName' | 'primaryKeyNames'>,
  accountDeleteDataService: AccountDeleteDataService,
  requestId: string,
  tables?: { table: string; where: string }[],
): Promise<void> {
  const { userId, email, isPremium } = data;
  // change limit if special override case
  const limitDefault = config.queueDelete.queryLimit;
  const limitOverrides = config.queueDelete.limitOverrides;
  const tableNames = tables ?? config.queueDelete.tableNames;

  for (const { table, where } of tableNames) {
    try {
      const whereCond =
        where === 'user_id'
          ? { user_id: userId }
          : where.includes('email')
            ? { [where]: email }
            : null;
      const limit =
        limitOverrides.find((lo) => lo.table === table)?.limit ?? limitDefault;
      if (whereCond == null) {
        throw new Error(
          `Unexpected where condition encountered -- logic for column ${where} not implemented`,
        );
      }
      let offset = 0;
      const sqsSendBatchCommands: SendMessageBatchCommand[] = [];
      let sqsEntries: SendMessageBatchRequestEntry[] = [];
      const loopCondition = true;

      while (loopCondition) {
        //get config.queueDelete.queryLimit records at a time
        const ids: TablePrimaryKeyModel =
          await accountDeleteDataService.getTableIds(
            table,
            offset,
            whereCond,
            limit,
          );
        if (!ids.primaryKeyValues.length) break;

        //convert config.queueDelete.queryLimit records to a sqs message
        sqsEntries.push(
          convertToSqsEntry({
            userId,
            email,
            isPremium,
            tableName: table,
            primaryKeyNames: ids.primaryKeyNames,
            primaryKeyValues: ids.primaryKeyValues,
            //traceId of the current SQS message, which
            //would be a new requestId for the POST /batchDelete endpoint
            traceId: `${data.traceId}/${nanoid()}`,
          }),
        );

        // a batch would contain 5*config.queueDelete.queryLimit records
        if (sqsEntries.length === config.aws.sqs.accountDeleteQueue.batchSize) {
          sqsSendBatchCommands.push(createSqsSendBatchCommand(sqsEntries));
          sqsEntries = [];
        }

        offset = offset + limit;
      }

      // If there's any remaining, send to SQS
      if (sqsEntries.length) {
        sqsSendBatchCommands.push(createSqsSendBatchCommand(sqsEntries));
      }

      await Promise.allSettled(
        sqsSendBatchCommands.map((command) => {
          return sqsSendBatch(command, userId, requestId, table);
        }),
      );
    } catch (error) {
      const errorMessage = `enqueueTablesForDeletion: Error - Failed to enqueue keys for given data.')`;

      const errorData = {
        userId: userId,
        requestId: requestId,
        table: table,
        where: where,
      };
      serverLogger.error({
        message: errorMessage,
        error: error,
        data: errorData,
      });
      Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
      Sentry.captureException(error);
    }
  }
}

/**
 * creates sqs batch command for the given sqs message entry
 * @param entries
 */
function createSqsSendBatchCommand(
  entries: SendMessageBatchRequestEntry[],
): SendMessageBatchCommand {
  return new SendMessageBatchCommand({
    Entries: entries,
    QueueUrl: config.aws.sqs.accountDeleteQueue.url,
  });
}

/**
 * Send messages in a batch to SQS. on error, logs to sentry and cloudwatch
 * @param command SQS message command
 * @param userId userId of the user whose PII will be deleted
 * @param requestId requestId of the /queueDelete endpoint
 * @param tableName tablename whose primary key is batched for deletion
 */
async function sqsSendBatch(
  command: SendMessageBatchCommand,
  userId: number,
  requestId: string,
  tableName: string,
): Promise<SendMessageBatchCommandOutput> {
  return sqs.send(command).catch((error) => {
    const errorMessage = `sqsSendBatch: Error - Failed to enqueue keys for given data.')`;

    serverLogger.error({
      message: errorMessage,
      error: error,
      errorData: {
        userId: userId,
        requestId: requestId,
        tableName: tableName,
      },
    });
    Sentry.addBreadcrumb({ message: errorMessage });
    Sentry.captureException(error);
  }) as Promise<SendMessageBatchCommandOutput>;
}

/**
 * Convert a JSON object to an SQS send message entry
 * @param message
 */
function convertToSqsEntry(message: SqsMessage): SendMessageBatchRequestEntry {
  return {
    Id: nanoid(),
    MessageBody: JSON.stringify(message),
  };
}

export default router;
