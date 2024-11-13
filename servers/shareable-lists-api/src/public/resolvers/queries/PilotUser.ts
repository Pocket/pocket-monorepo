import { isPilotUser as dbIsPilotUser } from '../../../database';

/**
 * Resolver for the public `isPilotUser` query.
 *
 * @param parent
 * @param _ // no input on this query
 * @param userId // in context
 * @param db // in context
 */
export async function isPilotUser(
  parent,
  _,
  { intUserId, db },
): Promise<boolean> {
  if (isNaN(intUserId)) {
    return false;
  }

  return (await dbIsPilotUser(db, intUserId)) > 0 ? true : false;
}
