import {
  DataSourceInterface,
  ListItemEnriched,
} from '../../datasource/DataSourceInterface';
import { indexInElasticSearch } from '../../elasticsearch';

import { Request, Response, NextFunction, Router } from 'express';
import { checkSchema, Schema, validationResult } from 'express-validator';
import { nanoid } from 'nanoid';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';
import { legacyMysqlInterface } from '../../datasource/MysqlDataSource';

export const router = Router();

const userItemsDeleteSchema: Schema = {
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
  checkSchema(userItemsDeleteSchema),
  validate,
  async (req: Request, res: Response) => {
    const requestId = req.body.traceId ?? nanoid();
    const userId = req.body.userId;
    const itemIds = req.body.itemIds;

    const db = legacyMysqlInterface();

    if (!(await db.isUserPremium(userId))) {
      serverLogger.log(`Not a premium user, skipping item update`, {
        userId,
        requestId,
      });

      return res.send({
        status: 'OK',
        message: `itemUpdate: Not premium for User ID: ${userId}, (requestId='${requestId}')`,
      });
    }

    serverLogger.info('starting to index items', {
      requestId,
      userId,
      itemIds,
    });

    const listItems = await getUserItems(db, userId, itemIds);

    if (listItems.length > 0) {
      indexInElasticSearch(listItems).catch((error) => {
        const message = `itemUpdate: Error - Failed to update items User ID: ${userId} items: ${listItems} (requestId='${requestId}')`;
        Sentry.addBreadcrumb({ message });
        Sentry.captureException(error);
        console.log(message);
        console.error(error);
      });
    }

    return res.send({
      status: 'OK',
      message: `itemUpdate: Updating items for User ID: ${userId} Item Ids: ${itemIds} (requestId='${requestId}')`,
    });
  },
);

/**
 * Construct ListItemEnriched from user and item ids.
 * @param dataSource
 * @param userId
 * @param itemIds
 */
const getUserItems = async (
  dataSource: DataSourceInterface,
  userId: number,
  itemIds: number[],
): Promise<ListItemEnriched[]> => {
  const [listItems, items] = await Promise.all([
    dataSource.getUserListItems(userId, itemIds),
    dataSource.getItems(itemIds),
  ]);

  return listItems.map((listItem) => {
    return {
      ...listItem,
      userId,
      item: items[listItem.itemId],
    };
  });
};
