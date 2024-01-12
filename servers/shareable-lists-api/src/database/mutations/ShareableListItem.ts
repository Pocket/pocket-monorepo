import { NotFoundError, UserInputError } from '@pocket-tools/apollo-utils';
import { ModerationStatus, PrismaClient } from '@prisma/client';
import {
  CreateShareableListItemInput,
  ShareableListItem,
  shareableListItemSelectFields,
  UpdateShareableListItemInput,
  UpdateShareableListItemsInput,
} from '../types';
import { PRISMA_RECORD_NOT_FOUND } from '../../shared/constants';
import { validateItemId } from '../../public/resolvers/utils';

import { sendEventHelper as sendEvent } from '../../snowplow/events';
import { EventBridgeEventType } from '../../snowplow/types';

/**
 * This mutation creates a shareable list item.
 *
 * @param db
 * @param data
 * @param userId
 */
export async function createShareableListItem(
  db: PrismaClient,
  data: CreateShareableListItemInput,
  userId: number | bigint
): Promise<ShareableListItem> {
  // make sure the itemId is valid
  // this is required as itemId must be a string at the API level, but is
  // actually a number in the db (legacy problems)
  validateItemId(data.itemId);

  // Retrieve the list this item should be added to.
  // Note: no new items should be added to lists that have been taken down
  // by the moderators.
  const list = await db.list.findFirst({
    where: {
      externalId: data.listExternalId,
      userId,
      moderationStatus: ModerationStatus.VISIBLE,
    },
    include: {
      listItems: true,
    },
  });

  if (!list) {
    throw new NotFoundError(
      `A list with the ID of "${data.listExternalId}" does not exist`
    );
  }

  // check if an item with this URL already exists in this list
  const itemExists = list.listItems.find((item) => {
    return item.url === data.url;
  });

  if (itemExists) {
    throw new UserInputError(
      `An item with the URL "${data.url}" already exists in this list`
    );
  }

  const input = {
    // coerce itemId to a number to conform to db schema
    itemId: parseInt(data.itemId),
    url: data.url,
    title: data.title ?? undefined,
    excerpt: data.excerpt ?? undefined,
    note: data.note ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
    publisher: data.publisher ?? undefined,
    authors: data.authors ?? undefined,
    sortOrder: data.sortOrder,
    listId: list.id,
  };

  let listItem;

  // execute the create and parent list updatedAt update in a single
  // transaction
  await db.$transaction(async (db) => {
    listItem = await db.listItem.create({
      data: input,
      select: shareableListItemSelectFields,
    });

    // update the `updatedAt` field on the parent list
    await db.list.update({
      data: {
        updatedAt: new Date().toISOString(),
      },
      where: {
        externalId: list.externalId,
      },
    });
  });

  //send event bridge event for shareable-list-item-created event type
  sendEvent(EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED, {
    shareableListItem: listItem,
    shareableListItemExternalId: listItem.externalId,
    listExternalId: list.externalId,
    isShareableListItemEventType: true,
  });

  return listItem;
}

/**
 * This mutation updates a single shareable list item.
 *
 * @param db
 * @param data
 * @param userId
 */
export async function updateShareableListItem(
  db: PrismaClient,
  data: UpdateShareableListItemInput,
  userId: number | bigint
): Promise<ShareableListItem> {
  // Retrieve the current record, pre-update
  const listItem = await db.listItem.findFirst({
    where: {
      externalId: data.externalId,
    },
    // we need to include the list to check the user id
    include: {
      list: true,
    },
  });

  // if no list item was found, or this list item is owned by another user,
  // return a not found error
  if (!listItem || parseInt(listItem.list.userId as any) !== userId) {
    throw new NotFoundError(`A list item by that ID could not be found`);
  }

  // if null was passed, remove from payload (or will break db constraint)
  if (data.sortOrder === null) {
    delete data.sortOrder;
  }

  // update the list item as well as the updatedAt value on the parent list
  const updatedListItem = await db.listItem.update({
    data: {
      note: data.note,
      sortOrder: data.sortOrder,
      updatedAt: new Date().toISOString(),
      // this sub-update can only be done when updating a list item, not when
      // creating. a limitation of prisma...
      list: {
        update: {
          updatedAt: new Date().toISOString(),
        },
      },
    },
    where: {
      externalId: data.externalId,
    },
  });

  //send event bridge event for shareable-list-item-updated event type
  sendEvent(EventBridgeEventType.SHAREABLE_LIST_ITEM_UPDATED, {
    shareableListItem: updatedListItem,
    shareableListItemExternalId: updatedListItem.externalId,
    listExternalId: listItem.list.externalId,
    isShareableListItemEventType: true,
  });

  return updatedListItem;
}

/**
 * This mutation updates an array of shareable list items, targeting sortOrder.
 *
 * @param db
 * @param data
 * @param userId
 */
export async function updateShareableListItems(
  db: PrismaClient,
  data: UpdateShareableListItemsInput[],
  userId: number | bigint
): Promise<ShareableListItem[]> {
  // store the updated shareable list items result here
  const updatedShareableListItems = [];

  // store the parent lists so we can update the updatedAt value
  // this *should* be an array of 1, but there's no code enforcement that all
  // listItems being operated on belong to the same list.
  let updatedShareableListExternalIds = [];

  // lets create an interactive transaction of sequential db calls,
  // where we can traverse through the array input and update each
  // shareable list item.
  // if one call fails, the entire transaction fails.
  await db.$transaction(async (db) => {
    for (const value of Object.values(data)) {
      const listItem = await db.listItem.findFirst({
        where: {
          externalId: value.externalId,
          list: {
            userId: userId,
          },
        },
      });

      if (!listItem) {
        throw new NotFoundError(`A list item by that ID could not be found`);
      }

      const updatedListItem = await db.listItem.update({
        data: {
          sortOrder: value.sortOrder,
          // even though prisma will update this value automatically, we want
          // to specify it here so we can test the specific value being set
          updatedAt: new Date().toISOString(),
        },
        where: {
          externalId: value.externalId,
        },
        // we need to include the list to get access to the list id
        include: {
          list: true,
        },
      });

      updatedShareableListExternalIds.push(updatedListItem.list.externalId);
      updatedShareableListItems.push(updatedListItem);
    }

    // remove duplicates from the array of parent list ids
    updatedShareableListExternalIds = [
      ...new Set(updatedShareableListExternalIds),
    ];

    // finally, update the updatedAt value of the parent lists
    for (const externalId of updatedShareableListExternalIds) {
      await db.list.update({
        data: {
          updatedAt: new Date().toISOString(),
        },
        where: {
          externalId,
        },
      });
    }
  });

  // we don't want to send events to snowplow inside the transaction,
  // as if one of the items in the input is invalid, we want to prevent valid
  // updates sent to snowplow as entire transaction call should be failed
  updatedShareableListItems.forEach((item) => {
    //send event bridge event for shareable-list-item-updated event type
    sendEvent(EventBridgeEventType.SHAREABLE_LIST_ITEM_UPDATED, {
      shareableListItem: item,
      shareableListItemExternalId: item.externalId,
      listExternalId: item.list.externalId,
      isShareableListItemEventType: true,
    });
  });

  return updatedShareableListItems;
}

/**
 * This mutation deletes a shareable list item. Lists that are HIDDEN cannot have their items deleted.
 *
 * @param db
 * @param externalId
 * @param userId
 */
export async function deleteShareableListItem(
  db: PrismaClient,
  externalId: string,
  userId: number | bigint
): Promise<ShareableListItem> {
  // retrieve the existing ListItem before it is deleted
  const listItem = await db.listItem.findUnique({
    where: {
      externalId,
    },
    include: {
      list: true, // also retrieve the list
    },
  });

  // a not found error should be throw if:
  // - the list item wasn't found
  // - the owner of the associated list does not match the user making the
  //   request (could be a malicious deletion attempt)
  // - the associated list has been removed due to moderation (in which case
  //   the user cannot modify any part of the list)
  if (
    !listItem ||
    Number(listItem.list.userId) !== userId ||
    listItem.list.moderationStatus == 'HIDDEN'
  ) {
    throw new NotFoundError('A list item by that ID could not be found');
  }

  // the delete and parent list update should happen in a single transaction
  await db.$transaction(async (db) => {
    // delete ListItem
    await db.listItem
      .delete({
        where: { externalId: listItem.externalId },
      })
      .catch((error) => {
        if (error.code === PRISMA_RECORD_NOT_FOUND) {
          throw new NotFoundError(`List Item ${externalId} cannot be found.`);
        } else {
          // some unexpected DB error
          throw error;
        }
      });

    // update the parent list's updatedAt value
    await db.list.update({
      data: {
        updatedAt: new Date().toISOString(),
      },
      where: {
        externalId: listItem.list.externalId,
      },
    });
  });

  // send event bridge event for shareable-list-item-deleted event type
  sendEvent(EventBridgeEventType.SHAREABLE_LIST_ITEM_DELETED, {
    shareableListItem: listItem,
    shareableListItemExternalId: listItem.externalId,
    listExternalId: listItem.list.externalId,
    isShareableListItemEventType: true,
  });

  return listItem;
}

/**
 * Deletes all list items for a list.
 * NB: userId is not checked here, as this method is called
 * @param db
 * @param listId
 * @returns
 */
export async function deleteAllListItemsForList(
  db: PrismaClient,
  listId: bigint
): Promise<number> {
  const batchResult = await db.listItem.deleteMany({
    where: { listId: listId },
  });

  return batchResult.count;
}
