import { isPilotUser as dbIsPilotUser } from '../../../database/queries';

/**
 * Resolver for the public `isPilotUser` query.
 *
 * @param parent
 * @param _ // no input on this query
 * @param userId // in context
 * @param db // in context
 */
export async function isPilotUser(parent, _, { userId, db }): Promise<boolean> {
  if (isNaN(userId)) {
    return false;
  }

  return (await dbIsPilotUser(db, userId)) > 0 ? true : false;
}
