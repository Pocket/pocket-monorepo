import { NotFoundError, UserInputError } from '@pocket-tools/apollo-utils';
import { ModerationStatus } from '.prisma/client';
import {
  AddItemInput,
  CreateShareableListItemInput,
  ListItemResponse,
  ListItemSelect,
  ListResponse,
  ShareableListItem,
  shareableListItemSelectFields,
  ShareableListSelect,
  UpdateShareableListItemInput,
  UpdateShareableListItemsInput,
} from '../types';
import { PRISMA_RECORD_NOT_FOUND } from '../../shared/constants';
import { validateItemId } from '../../public/resolvers/utils';
import { v4 as uuid } from 'uuid';

import { sendEventHelper as sendEvent } from '../../snowplow/events';
import { EventBridgeEventType } from '../../snowplow/types';
import { BaseContext } from '../../shared/types';

/**
 * What can actually go into the database vs. client-provided type
 */
type CreateListItemDb = Omit<AddItemInput, 'itemId'> & {
  // Pre mysql 8, prisma MUST rely on JS layer vs. database to create
  // uuid; if we don't use prisma and we haven't yet updated the schema
  // to mysql 8 with default uuid generation, we MUST populate this value ourselves.
  // We want to know the externalId before insert anyway because MySQL doesn't
  // support RETURNING statement, and this is the most performant way to query back
  // an inserted row.
  externalId: string;
  listId: number;
  itemId: number;
  sortOrder: number;
};

/**
 * This mutation creates a shareable list item.
 *
 * @param context
 * @param data
 * @param userId
 */
export async function createShareableListItem(
  context: BaseContext,
  data: CreateShareableListItemInput,
  userId: number | bigint,
): Promise<ShareableListItem> {
  const { db } = context;
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
      `A list with the ID of "${data.listExternalId}" does not exist`,
    );
  }

  // check if an item with this URL already exists in this list
  // TODO (@kschelonka): consider uniqeuness constraint over listId and url,
  // via a generated hashed_url column
  const itemExists = list.listItems.find((item) => {
    return item.url === data.url;
  });

  if (itemExists) {
    throw new UserInputError(
      `An item with the URL "${data.url}" already exists in this list`,
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

  const listItemUpdate = db.listItem.create({
    data: input,
    select: shareableListItemSelectFields,
  });

  const listUpdate = db.list.update({
    data: {
      updatedAt: new Date().toISOString(),
    },
    where: {
      externalId: list.externalId,
    },
  });

  // execute the create and parent list updatedAt update in a single
  // transaction
  const [listItem] = await db.$transaction([listItemUpdate, listUpdate]);

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
 * Mutation to bulk add items to an extant shareable list.
 * Behaves like an 'append' action, ignoring any inputs that
 * already exist in the list.
 *
 * @param context
 * @param listId The "externalId" list identifier
 * @param data
 * @param userId
 */
export async function addToShareableList(
  context: BaseContext,
  { listExternalId, items }: { listExternalId: string; items: AddItemInput[] },
  userId: number | bigint,
): Promise<ListResponse> {
  const { db, conn } = context;

  // Retrieve the list this item should be added to.
  // Note: no new items should be added to lists that have been taken down
  // by the moderators.
  // TODO (@kschelonka): revisit this visibility requirement with UX changes
  // If the list doesn't exist it should fail from a FK constraint,
  // but since the externalId isn't the FK we can't rely on that
  const list = await db.list.findFirst({
    where: {
      externalId: listExternalId,
      userId,
      moderationStatus: ModerationStatus.VISIBLE,
    },
  });
  if (!list) {
    throw new NotFoundError(
      `A list with the ID of "${listExternalId}" does not exist`,
    );
  }
  // TODO: Kat - fix this input type, it's not the same as graphql schema
  const input: CreateListItemDb[] = items.map((item, index) => {
    // Ensure itemId is a valid number
    validateItemId(item.itemId);
    return {
      ...item,
      itemId: parseInt(item.itemId),
      // All these will have the same createdAt value, which means
      // that we can't rely on that for a default sort order.
      // If sort order isn't applied, take the order of the input array.
      // Alternatively, could change the sort fallback so that it uses the
      // internal auto-increment ID.
      sortOrder: index,
      listId: list.id as unknown as number, // bigint issues
      // In the future this could optionally be provided by clients
      // (would require additional updates in other methods)
      externalId: uuid(),
    };
  });

  const { inserts, updatedList } = await conn
    .transaction()
    .execute(async (trx) => {
      const highestSortOrder = (
        await trx
          .selectFrom('ListItem')
          .select((eb) => eb.fn.max('sortOrder').as('sortOrder'))
          .where('listId', '=', list.id as unknown as number) // prisma bigint...
          .executeTakeFirst()
      ).sortOrder;
      const sortStart = highestSortOrder != null ? highestSortOrder + 1 : 0;
      // Closure for iterative conditional inserts of List Items
      const conditionalItemInsert = async (
        item: CreateListItemDb,
      ): Promise<ListItemResponse | undefined> => {
        const itemExists = await trx
          .selectFrom('ListItem')
          .where('url', '=', item.url)
          .where('listId', '=', item.listId)
          .select('id')
          .executeTakeFirst();
        if (itemExists == null) {
          await trx
            .insertInto('ListItem')
            .values({ ...item, sortOrder: item.sortOrder + sortStart })
            .execute();
          // We don't have RETURNING statement so we have to query back
          return await trx
            .selectFrom('ListItem')
            .where('externalId', '=', item.externalId)
            .select(ListItemSelect)
            .executeTakeFirstOrThrow();
        } else {
          return Promise.resolve(undefined);
        }
      };
      // Iterate vs. Promise.all to avoid potential concurrency issues
      const inputPromises = input.map((item) => conditionalItemInsert(item));
      const inserts: ListItemResponse[] = [];
      for await (const item of inputPromises) {
        if (item != null) {
          inserts.push(item);
        }
      }
      // Finally, update the parent list `updatedAt`
      await trx
        .updateTable('List')
        .set({
          // I would think that the driver converts to the correct timezone,
          // rendering this unncessary...
          // but this stays consistent with the rest of the app code.
          updatedAt: new Date().toISOString(),
        })
        .where('externalId', '=', listExternalId)
        .execute();
      const updatedList = await trx
        .selectFrom('List')
        .where('externalId', '=', listExternalId)
        .select(ShareableListSelect)
        .executeTakeFirstOrThrow();
      return { inserts, updatedList };
    });
  //send event bridge event for shareable-list-item-created event type
  inserts.forEach((item) => {
    if (item != null) {
      sendEvent(EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED, {
        // "bigint" headaches
        // https://github.com/prisma/prisma/issues/7570
        // Dealing with this properly is more work than the type safety is worth
        shareableListItem: item as any,
        shareableListItemExternalId: item.externalId,
        listExternalId: updatedList.externalId,
        isShareableListItemEventType: true,
      });
    }
  });
  return updatedList;
}

/**
 * This mutation updates a single shareable list item.
 *
 * @param context
 * @param data
 * @param userId
 */
export async function updateShareableListItem(
  context: BaseContext,
  data: UpdateShareableListItemInput,
  userId: number | bigint,
): Promise<ShareableListItem> {
  const { db } = context;
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
 * @param context
 * @param data
 * @param userId
 */
export async function updateShareableListItems(
  context: BaseContext,
  data: UpdateShareableListItemsInput[],
  userId: number | bigint,
): Promise<ShareableListItem[]> {
  const { db } = context;
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
 * @param context
 * @param externalId
 * @param userId
 */
export async function deleteShareableListItem(
  context: BaseContext,
  externalId: string,
  userId: number | bigint,
): Promise<ShareableListItem> {
  const { db } = context;
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
 * @param context
 * @param listId
 * @returns
 */
export async function deleteAllListItemsForList(
  context: BaseContext,
  listId: bigint,
): Promise<number> {
  const { db } = context;
  const batchResult = await db.listItem.deleteMany({
    where: { listId: listId },
  });

  return batchResult.count;
}
