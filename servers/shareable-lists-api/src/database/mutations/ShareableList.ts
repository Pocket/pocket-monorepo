import {
  ForbiddenError,
  NotFoundError,
  UserInputError,
} from '@pocket-tools/apollo-utils';
import { Visibility, ModerationStatus } from '.prisma/client';
// import slugify from 'slugify';
import {
  CreateShareableListInput,
  CreateAndAddToShareableListInput,
  ModerateShareableListInput,
  ShareableList,
  ShareableListComplete,
  shareableListItemSelectFields,
  UpdateShareableListInput,
  ListItemSelect,
  ShareableListSelect,
} from '../types';
import {
  createShareableListItem,
  deleteAllListItemsForList,
  CreateListItemDb,
} from './ShareableListItem';
import {
  ACCESS_DENIED_ERROR,
  PRISMA_RECORD_NOT_FOUND,
} from '../../shared/constants';
import {
  getShareableList,
  // isPilotUser
} from '..';
// import config from '../../config';
import { validateItemId } from '../../public/resolvers/utils';
import { sendEventHelper } from '../../snowplow/events';
import { EventBridgeEventType } from '../../snowplow/types';
import { BaseContext } from '../../shared/types';
import { v4 as uuid } from 'uuid';

/**
 * This mutation creates a shareable list, and _only_ a shareable list
 *
 * @param context
 * @param listData
 * @param userId
 */
export async function createShareableList(
  context: BaseContext,
  listData: CreateShareableListInput,
  userId: number | bigint,
): Promise<ShareableList> {
  const { db } = context;
  const { listItem, ...listInput } = listData;

  // check if listItem data is passed
  if (listItem) {
    // make sure the itemId is valid - if not, fail the entire operation early
    //
    // this is required as itemId must be a string at the API level, but is
    // actually a number in the db (legacy problems)
    validateItemId(listItem.itemId);
  }

  // check if the title already exists for this user
  const titleExists = await db.list.count({
    where: { title: listData.title, userId: userId },
  });

  if (titleExists) {
    throw new UserInputError(
      `A list with the title "${listData.title}" already exists`,
    );
  }

  // create ShareableList in db
  const list: ShareableList = await db.list.create({
    data: { ...listInput, userId },
    include: {
      listItems: { select: shareableListItemSelectFields },
    },
  });

  // if ShareableListItem was passed in the request, create it in the db
  if (listItem) {
    // first set the list external id
    listItem['listExternalId'] = list.externalId;
    // create the ShareableListItem
    const createdListItem = await createShareableListItem(
      context,
      listItem,
      userId,
    );
    // add the created ShareableListItem to the created ShareableList
    list.listItems = [createdListItem];
  }

  //send event bridge event for shareable-list-created event type
  sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_CREATED, {
    shareableList: list as ShareableListComplete,
    isShareableListEventType: true,
  });

  return list;
}

/**
 * Create a new List and add one or more items to it at the same time.
 * @param context
 * @param data
 * @param userId
 * @returns
 */
export async function createAndAddToShareableList(
  context: BaseContext,
  data: CreateAndAddToShareableListInput,
  userId: number | bigint,
): Promise<ShareableList> {
  const { db, conn } = context;
  const { itemData, ...listData } = data;
  const listInput = {
    ...listData,
    // again, prisma's bigint making type safety hard...
    userId: userId as any,
    externalId: uuid(),
  };
  // check if the title already exists for this user
  // TODO (@kschelonka): add this as a constraint using generated hash column
  // For future modeling, if we really want to be parsimonious we can use that
  // hash as the "externalId"
  const titleExists = await db.list.count({
    where: { title: listData.title, userId: userId },
  });

  if (titleExists) {
    throw new UserInputError(
      `A list with the title "${listData.title}" already exists`,
    );
  }
  // The relational link depends on an auto-generated listId, so that will be
  // pouplated inside the transaction
  const itemInput: Array<Omit<CreateListItemDb, 'listId'>> = itemData.map(
    (item, index) => {
      validateItemId(item.itemId);
      return {
        ...item,
        itemId: parseInt(item.itemId),
        sortOrder: index,
        externalId: uuid(),
      };
    },
  );
  // Create a list and populate it with items in one transaction
  // If the item insertion fails, then the list will not be created.
  const { items, list } = await conn.transaction().execute(async (trx) => {
    await trx.insertInto('List').values(listInput).execute();
    const list = await trx
      .selectFrom('List')
      .where('externalId', '=', listInput.externalId)
      .select(ShareableListSelect)
      .executeTakeFirstOrThrow();
    const itemInserts: CreateListItemDb[] = itemInput.map((item) => ({
      ...item,
      listId: list.id,
    }));
    await trx.insertInto('ListItem').values(itemInserts).execute();
    const items = await trx
      .selectFrom('ListItem')
      .where('listId', '=', list.id)
      .select(ListItemSelect)
      .orderBy('sortOrder', 'asc')
      .execute();
    return { items, list };
  });
  const completeList: ShareableList = {
    ...list,
    // bigint causes issues again...
    id: list.id as unknown as bigint,
    userId: list.userId as unknown as bigint,
    listItems: items as any, // nested bigints
  };
  //send event bridge event for shareable-list-created event type
  sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_CREATED, {
    shareableList: completeList as ShareableListComplete,
    isShareableListEventType: true,
  });
  //send event bridge event for shareable-list-item-created event type
  items.forEach((item) => {
    sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_ITEM_CREATED, {
      // "bigint" headaches
      // https://github.com/prisma/prisma/issues/7570
      // Dealing with this properly is more work than the type safety is worth
      shareableListItem: item as any,
      shareableListItemExternalId: item.externalId,
      listExternalId: list.externalId,
      isShareableListItemEventType: true,
    });
  });
  return completeList;
}

/**
 * This mutation updates a shareable list, but does not allow to make a list public.
 * Some of the blocks of code are commented out due to removing ability to make lists public.
 * See ticket: https://getpocket.atlassian.net/browse/OSL-577
 *
 * @param context
 * @param data
 * @param userId
 */
export async function updateShareableList(
  context: BaseContext,
  data: UpdateShareableListInput,
  userId: number | bigint,
): Promise<ShareableList> {
  const { db } = context;
  // Retrieve the current record, pre-update
  const list = await getShareableList(db, userId, data.externalId);

  if (!list) {
    throw new NotFoundError(`A list by that ID could not be found`);
  }

  // we don't allow lists to be public anymore. block updates that try to make a list from PRIVATE to PUBLIC
  if (list.status === Visibility.PRIVATE && data.status === Visibility.PUBLIC) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  // until moderation is in place, we need to restrict non-pilot users from
  // creating public lists. this is also enforced on the client, but an extra
  // check here in case someone is clever.
  // if you're trying to go from private to public, you have to be in the pilot
  // if (list.status === Visibility.PRIVATE && data.status === Visibility.PUBLIC) {
  //   const isInPilot = await isPilotUser(db, userId);

  //   if (isInPilot <= 0) {
  //     throw new ForbiddenError(ACCESS_DENIED_ERROR);
  //   }
  // }

  // If the title is getting updated, check if the user already has a list
  // with the same title.
  if (data.title && data.title !== list.title) {
    const titleExists = await db.list.count({
      where: {
        title: data.title,
        userId: userId,
        externalId: { not: data.externalId },
      },
    });

    if (titleExists) {
      throw new UserInputError(
        `A list with the title "${data.title}" already exists`,
      );
    }
  }

  // If there is no slug and the list is being shared with the world,
  // let's generate a unique slug from the title. Once set, it will not be
  // updated to sync with any further title edits.
  // if (data.status === Visibility.PUBLIC && !list.slug) {
  //   // run the title through the slugify function
  //   const slugifiedTitle = slugify(data.title ?? list.title, config.slugify);

  //   // if title was made up entirely of characters that the slug cannot contain,
  //   // e.g. emojis, generate a neutral-sounding, short slug
  //   const preparedSlug =
  //     slugifiedTitle.length > 0 ? slugifiedTitle : 'shared-list';

  //   // First check how many slugs containing the list title already exist in the db
  //   const slugCount = await db.list.count({
  //     where: {
  //       userId,
  //       slug: { contains: preparedSlug },
  //     },
  //   });

  //   // if there is at least 1 slug containing title of list to update,
  //   // append next consecutive # of slugCount to data.slug
  //   if (slugCount) {
  //     data.slug = `${preparedSlug}-${slugCount + 1}`;
  //   } else {
  //     // If an updated title is provided, generate the slug from that,
  //     // otherwise default to the title saved previously.
  //     data.slug = preparedSlug;
  //   }
  // }

  // even though @updatedAt in the prisma schema will auto-update this value
  // on a db update, we set specifically here to strong test the value in our
  // integration tests.
  data.updatedAt = new Date().toISOString();

  const updatedList = await db.list.update({
    data,
    where: { externalId: data.externalId },
    include: {
      listItems: {
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      },
    },
  });

  // send update event to event bridge
  updateShareableListBridgeEventHelper(data, updatedList, list);

  return updatedList;
}

/**
 * Apply moderation to a ShareableList.
 *
 * @param context
 * @param data
 * @throws { NotFoundError } if the list does not exist
 */
export async function moderateShareableList(
  context: BaseContext,
  data: ModerateShareableListInput,
): Promise<ShareableListComplete> {
  const { db } = context;
  const exists = await db.list.count({
    where: { externalId: data.externalId },
  });
  if (!exists) {
    throw new NotFoundError(`List ${data.externalId} cannot be found.`);
  }
  // The update is safe to do even in the case where the record does not exist --
  // Prisma will throw a predictable error here. However, Prisma will also log that
  // error, which feels confusing, so we'll add the count query above to make sure we
  // don't have confusing logged errors, and leads to this kind of ugly block below
  const list = await db.list
    .update({
      data: data,
      where: { externalId: data.externalId },
      include: {
        listItems: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
          ],
        },
      },
    })
    .catch((error) => {
      if (error.code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundError(`List ${data.externalId} cannot be found.`);
      } else {
        throw error;
      }
    });

  // for now, we only support snowplow events for taking down a list (shareable-list-hidden trigger)
  if (data.moderationStatus === ModerationStatus.HIDDEN) {
    sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_HIDDEN, {
      shareableList: list as ShareableListComplete,
      isShareableListEventType: true,
    });
  }
  if (data.moderationStatus === ModerationStatus.VISIBLE) {
    sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_UNHIDDEN, {
      shareableList: list as ShareableListComplete,
      isShareableListEventType: true,
    });
  }
  return list;
}

/**
 * This method deletes a shareable list, if the owner of the list
 * represented by externalId matches the owner of the list.
 *
 * @param context
 * @param externalId
 * @param userId
 */
export async function deleteShareableList(
  context: BaseContext,
  externalId: string,
  userId: number | bigint,
): Promise<ShareableList> {
  const { db } = context;
  // Note for PR : input is unsanitized
  const deleteList = await db.list.findUnique({
    where: { externalId: externalId },
    include: { listItems: true },
  });

  // if the list can't be found, or a user is trying to delete someone else's
  // list, throw a not found error. (we don't need to let the malicious user
  // know they found someone else's list id.)
  if (deleteList === null || deleteList.userId !== BigInt(userId)) {
    throw new NotFoundError(`List ${externalId} cannot be found.`);
  }
  // This delete must occur before the list is actually deleted,
  // due to a foreign key constraint on ListItems. We should remove this
  // foreign key constraint for a number of reasons.
  // In the small context here of deletes, the foreign key constraint makes
  // this action both less safe and slower:
  // Less safe: If the list item deletion encounters a failure partway through
  // the list will remain in place, and will also be mangled. In this case it
  // would be far preferable to guarantee deletion of the list entity -- thus removing
  // it from userspace -- first. It is not critical that the list item table be
  // consistent; there is no harm (other than disk space) in orphaned list item rows,
  // and we're eventually going to need to clean things up anyway.
  // Slower: Without the foreign key constraint, we do not need to `await` the result
  // of the list item deletion, it could happen asynchronously
  // For these and similar reasons foreign keys are typically not used in environments
  // running at high scale (e.g. Etsy, etc.)
  // Leaving this in now, so we can discuss and circle back and keep moving :)
  await deleteAllListItemsForList(context, deleteList.id);

  // Now that we've checked that we can delete the list, let's delete it.
  // We'll catch the case where the list has been deleted under us, to
  // account for a potential race conditions.
  // This operation is possible to execute with one query, using both the
  // externalId and the target userId but requires that the `extendedWhereUnique`
  // prisma preview flag be enabled.
  // We don't need the return value here, since we have it above, so we
  // tell prisma to not select anything
  await db.list
    .delete({
      where: { id: deleteList.id },
      select: { id: true },
    })
    .catch((error) => {
      // According to the Prisma docs, this should be a typed error
      // of type PrismaClientKnownRequestError, with a code, but it doesn't
      // come through typed
      if (error.code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundError(`List ${externalId} cannot be found.`);
      } else {
        // some unexpected DB error
        throw error;
      }
    });

  //send event bridge event for shareable-list-deleted event type
  sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_DELETED, {
    shareableList: deleteList as ShareableListComplete,
    isShareableListEventType: true,
  });
  return deleteList;
}

/**
 * updateShareableList mutation does a lot of things, so we need to break down the operations in a helper function
 * to determine what events to send to snowplow
 **/
function updateShareableListBridgeEventHelper(
  data: UpdateShareableListInput,
  updatedList: ShareableListComplete,
  list: ShareableList,
) {
  // check if list status was updated
  if (data.status !== list.status) {
    // if list was published, send event bridge event for shareable-list-published event type
    if (data.status === Visibility.PUBLIC) {
      sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_PUBLISHED, {
        shareableList: updatedList as ShareableListComplete,
        isShareableListEventType: true,
      });
    }
    // else if list was unpublished, send event bridge event for shareable-list-unpublished event type
    else if (data.status === Visibility.PRIVATE) {
      sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_UNPUBLISHED, {
        shareableList: updatedList as ShareableListComplete,
        isShareableListEventType: true,
      });
    }
  }
  // if list title or description are updated, send event bridge event for shareable-list-updated event type
  if (
    (data.title && data.title !== list.title) ||
    (data.description && data.description !== list.description)
  ) {
    sendEventHelper(EventBridgeEventType.SHAREABLE_LIST_UPDATED, {
      shareableList: updatedList as ShareableListComplete,
      isShareableListEventType: true,
    });
  }
}
