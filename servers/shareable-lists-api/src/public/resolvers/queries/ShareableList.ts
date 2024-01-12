import { NotFoundError } from '@pocket-tools/apollo-utils';
import {
  getShareableList as dbGetShareableList,
  getShareableListPublic as dbGetShareableListPublic,
  getShareableLists as dbGetShareableLists,
} from '../../../database/queries';
import { ShareableList } from '../../../database/types';
import { validateUserId } from '../utils';

/**
 * Resolver for the public `shareableList` query.
 *
 * @param parent
 * @param externalId
 * @param userId
 * @param db
 */
export async function getShareableList(
  parent,
  { externalId },
  { userId, db }
): Promise<ShareableList> {
  const list = await dbGetShareableList(
    db,
    await validateUserId(db, userId),
    externalId
  );

  if (!list) {
    throw new NotFoundError(externalId);
  }

  return list;
}

/**
 * Resolver for the `shareableListPublic` query.
 *
 * @param parent
 * @param externalId
 * @param db
 */
export async function getShareableListPublic(
  parent,
  { externalId, slug },
  { db }
): Promise<ShareableList> {
  const list = await dbGetShareableListPublic(db, externalId, slug);

  if (!list) {
    throw new NotFoundError(externalId);
  }

  return list;
}

/**
 * Retrieves all available shareable lists for a userId (passed thru the headers).
 *
 * @param parent
 * @param userId
 * @param db
 */
export async function getShareableLists(
  parent,
  _,
  { userId, db }
): Promise<ShareableList[]> {
  return await dbGetShareableLists(db, await validateUserId(db, userId));
}
