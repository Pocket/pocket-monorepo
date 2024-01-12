import { Request, Response } from 'express';
import { Router } from 'express';
import { checkSchema, Schema } from 'express-validator';
import * as Sentry from '@sentry/node';
import { client } from '../../database/client';
import { validate } from './';

const router = Router();
const db = client();

const deleteUserDataSchema: Schema = {
  userId: {
    in: ['body'],
    errorMessage: 'Must provide valid userId',
    isInt: true,
    toInt: true,
  },
};

/**
 * This method returns an array of shareable list ids for a user
 * @param userId
 */
export async function getAllShareableListIdsForUser(
  userId: number | bigint
): Promise<number[] | bigint[]> {
  const shareableLists = await db.list.findMany({
    where: {
      userId,
    },
  });
  const shareableListIds = [];
  shareableLists.forEach(function (list) {
    // db spits list.id as 1n (bigint) but needs to be interpreted as string in order
    // to apply parseInt which accepts a str argument, hence, double casting
    shareableListIds.push(parseInt(list.id as unknown as string));
  });
  return shareableListIds;
}

/**
 * This method deletes shareable list items in bulk for a user
 * @param listIds
 */
export async function deleteShareableListItemsForUser(
  listIds: number[] | bigint[]
): Promise<number> {
  const batchResult = await db.listItem.deleteMany({
    where: { listId: { in: listIds } },
  });

  return batchResult.count;
}

/**
 * This method deletes all shareable list data for a user
 * @param userId
 */
async function deleteShareableListUserData(
  userId: number | bigint
): Promise<string> {
  const shareableListIds = await getAllShareableListIdsForUser(userId);
  // if there are no lists found for a userId, lets not make unecessary calls
  // to the db
  if (shareableListIds.length === 0) {
    return `No shareable list data to delete for User ID: ${userId}`;
  }
  // First, delete all list items if there are any
  await deleteShareableListItemsForUser(shareableListIds);
  // Now, delete all lists
  await db.list
    .deleteMany({
      where: { userId },
    })
    .catch((error) => {
      // some unexpected DB error, log to Sentry, but don't halt program
      Sentry.captureException('Failed to delete shareable list data: ', error);
    });
  return `Deleting shareable lists data for User ID: ${userId}`;
}

router.post(
  '/',
  checkSchema(deleteUserDataSchema),
  validate,
  (req: Request, res: Response) => {
    const userId = req.body.userId;

    // Delete all shareable lists data for userId from DB
    deleteShareableListUserData(userId)
      .then((result) => {
        return res.send({
          status: 'OK',
          message: result,
        });
      })
      .catch((e) => {
        // In the unlikely event that an error is thrown,
        // log to Sentry but don't halt program
        Sentry.captureException(e);
        return res.send({
          status: 'BAD_REQUEST',
          message: e,
        });
      });
  }
);

export default router;
