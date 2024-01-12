import { ForbiddenError, UserInputError } from '@pocket-tools/apollo-utils';
import { ModerationStatus } from '@prisma/client';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';
import { ShareableListComplete } from '../../../database/types';
import { moderateShareableList as dbModerateShareableList } from '../../../database/mutations';
import { IAdminContext } from '../../context';

/**
 * Resolver for the admin 'removeShareableList' mutation.
 *
 * This mutation removes shareable lists from all user views.
 *
 * @param parent
 * @param data
 * @param context
 * @throws { ForbiddenError } if the user doesn't have moderation permissions
 * @throws { NotFoundError } if the list does not exist
 * @throws { UserInputError } if the moderationReason is empty
 */
export async function moderateShareableList(
  parent,
  { data },
  context: IAdminContext
): Promise<ShareableListComplete> {
  const { db, authenticatedUser } = context;
  if (!authenticatedUser.hasFullAccess) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }
  data.moderatedBy = authenticatedUser.username;
  if (data.moderationDetails) {
    data.moderationDetails = data.moderationDetails.trim();
  }
  // if list is set to hidden, enforce moderationReason is also passed
  if (data.moderationStatus === ModerationStatus.HIDDEN) {
    if (!data.moderationReason) {
      throw new UserInputError(`Moderation reason required.`);
    }
  }
  // if list is set to visible, enforce restorationReason is also passed
  if (data.moderationStatus === ModerationStatus.VISIBLE) {
    if (
      !data.restorationReason ||
      (data.restorationReason && data.restorationReason.trim().length === 0)
    ) {
      throw new UserInputError(`List restoration reason required.`);
    }
    data.restorationReason = data.restorationReason.trim();
  }
  return await dbModerateShareableList(db, data);
}
