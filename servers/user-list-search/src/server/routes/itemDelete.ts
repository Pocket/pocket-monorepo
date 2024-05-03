import { deleteFromElasticSearch } from '../../elasticsearch.js';

import { Request, Response, NextFunction, Router } from 'express';
import { checkSchema, Schema, validationResult } from 'express-validator';
import { nanoid } from 'nanoid';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';

export const router = Router();

const itemDeleteSchema: Schema = {
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
  itemIds: {
    in: ['body'],
    errorMessage: 'Must provide valid itemIds',
    isArray: true,
    toArray: true,
    custom: {
      options: (value) => {
        if (!value.every(Number.isInteger)) {
          throw new Error('itemIds can only contain integers');
        }
        return true;
      },
    },
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

router.post(
  '/',
  checkSchema(itemDeleteSchema),
  validate,
  async (req: Request, res: Response) => {
    const requestId = req.body.traceId ?? nanoid();
    const userId = req.body.userId;
    const itemIds = req.body.itemIds;

    serverLogger.info('starting to delete items', {
      requestId,
      userId,
      itemIds,
    });

    const listItems = itemIds.map((itemId) => {
      return { itemId, userId };
    });

    if (listItems.length > 0) {
      try {
        await deleteFromElasticSearch(listItems);
      } catch (error) {
        const message = `itemDelete: Error - Failed to delete user items User ID: ${userId} items: ${listItems} (requestId='${requestId}')`;
        Sentry.addBreadcrumb({ message });
        Sentry.captureException(error);
        console.log(message);
        console.error(error);
      }
    }

    return res.send({
      status: 'OK',
      message: `itemDelete: Deleting items for User ID: ${userId} Item Ids: ${itemIds} (requestId='${requestId}')`,
    });
  },
);
