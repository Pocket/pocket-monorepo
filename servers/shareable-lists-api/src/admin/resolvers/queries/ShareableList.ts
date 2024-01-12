import { ForbiddenError, NotFoundError } from '@pocket-tools/apollo-utils';
import { searchShareableList as dbSearchShareableList } from '../../../database/queries';
import { ShareableListComplete } from '../../../database/types';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

/**
 * Resolver for the admin `searchShareableList` query.
 *
 * @param parent
 * @param externalId
 * @param authenticatedUser
 * @param db
 */
export async function searchShareableList(
  parent,
  { externalId },
  { authenticatedUser, db }
): Promise<ShareableListComplete> {
  // access denied if a user cannot access this admin tool
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  const list = await dbSearchShareableList(db, externalId);

  if (!list) {
    throw new NotFoundError(`List ${externalId} cannot be found.`);
  }

  return list;
}
