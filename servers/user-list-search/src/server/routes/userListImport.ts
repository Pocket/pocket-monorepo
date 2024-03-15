import { config } from '../../config';
import { sendMessage } from '../../sqs';
import { UserItemsSqsMessage } from '../../shared';

import { Request, Response, NextFunction, Router } from 'express';
import { checkSchema, Schema, validationResult } from 'express-validator';
import nanoid from 'nanoid';
import { serverLogger } from '@pocket-tools/ts-logger';
import { legacyMysqlInterface } from '../../datasource/MysqlDataSource';

export const router = Router();

const userListImportSchema: Schema = {
  traceId: {
    in: ['body'],
    optional: true,
    isString: true,
    notEmpty: true,
  },
  userId: {
    in: ['body'],
    errorMessage: 'Must provide valid userId',
    isInt: true,
    toInt: true,
  },
  backfill: {
    in: ['body'],
    errorMessage: 'Must provide if its a backfill update',
    isBoolean: true,
    toBoolean: true,
  },
};

export function validate(
  req: Request,
  res: Response,
  next: NextFunction,
): Response {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() })
      .setHeader('Content-Type', 'application/json');
  }
  next();
}

const ITEMS_CHUNK_SIZE = 1000;

router.post(
  '/',
  checkSchema(userListImportSchema),
  validate,
  async (req: Request, res: Response) => {
    const requestId = req.body.traceId ?? nanoid.nanoid();
    const userId = req.body.userId;
    const backfill = req.body.backfill;
    const db = legacyMysqlInterface();

    if (!(await db.isUserPremium(userId))) {
      serverLogger.info(`Not a premium user, skipping import`, {
        userId,
        requestId,
      });

      return res.send({
        status: 'OK',
        message: `userListImport: Not premium for User ID: ${userId}, (requestId='${requestId}')`,
      });
    }

    serverLogger.info('Started processing', { userId, requestId });

    const itemIds = await db.getUserItemIds(userId);

    serverLogger.info('Found items', {
      userId,
      itemCount: itemIds.length,
    });
    for (let start = 0; start < itemIds.length; start += ITEMS_CHUNK_SIZE) {
      serverLogger.info('Creating chunk of items to process', {
        userId,
        start: start,
        end: start + ITEMS_CHUNK_SIZE,
      });

      const chunkedItemIds = itemIds.slice(start, start + ITEMS_CHUNK_SIZE);

      const userItemsUpdateQueueMessage: UserItemsSqsMessage = {
        userItems: [{ userId, itemIds: chunkedItemIds }],
      };

      await sendMessage(
        backfill
          ? config.aws.sqs.userItemsUpdateBackfillUrl
          : config.aws.sqs.userItemsUpdateUrl,
        userItemsUpdateQueueMessage,
      );
    }

    serverLogger.info('Completed processing', {
      userId,
      requestId,
    });

    return res.send({
      status: 'OK',
      message: `userListImport: Updating items for User ID: ${userId} (requestId='${requestId}')`,
    });
  },
);
