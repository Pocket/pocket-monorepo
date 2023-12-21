import { IContext } from '../context';
import { UserModel } from '../models/User';
import { ForbiddenError } from '@pocket-tools/apollo-utils';
import { UserDataService } from '../dataService/userDataService';
import { ExpireUserWebSessionReason } from '../types';
import { PinpointController } from '../aws/pinpointController';
import { EventType } from '../events/eventType';
import { serverLogger } from '../logger';

const blockedUsersFromDeletion = ['8008162'];

export async function deleteUser(_, args, context: IContext): Promise<string> {
  serverLogger.info('requested deletion for user', {
    userId: context.userId,
  });
  if (blockedUsersFromDeletion.includes(context.models.user.id)) {
    serverLogger.info('Stopped deletion of user', {
      userId: context.userId,
    });
    return context.userId;
  }
  return context.models.user.delete();
}

export async function updateEmail(
  _,
  args: { id: string; email: string },
  context: IContext,
): Promise<UserModel> {
  return context.models.user.updateEmail(args.email);
}

export async function deleteUserByFxaId(
  _,
  args: { id: string },
  context: IContext,
): Promise<string> {
  if (context.fxaUserId != args.id) {
    serverLogger.error('FxA user id mismatch in deletion', {
      header: context.fxaUserId,
      input: args.id,
    });
    throw new ForbiddenError(`FxA user id mismatch in deletion`);
  }

  if (
    context.models.user &&
    blockedUsersFromDeletion.includes(context.models.user.id)
  ) {
    serverLogger.info('Stopped fxa deletion of user', {
      userId: context.models.user.id,
    });
    return context.models.user.id;
  }
  return context.models.user.delete();
}

export async function updateUserEmailByFxaId(
  _,
  args: { id: string; email: string },
  context: IContext,
): Promise<UserModel> {
  if (context.fxaUserId != args.id) {
    serverLogger.error('FxA user id mismatch in update email', {
      header: context.fxaUserId,
      input: args.id,
    });
    throw new ForbiddenError(`FxA user id mismatch in update email`);
  }
  return context.models.user.updateEmail(args.email);
}

export async function expireUserWebSessionByFxaId(
  _,
  args: { id: string; reason: ExpireUserWebSessionReason },
  context: IContext,
): Promise<string> {
  if (context.fxaUserId != args.id) {
    serverLogger.error('FxA user id mismatch in expiring web session tokens', {
      header: context.fxaUserId,
      input: args.id,
    });
    throw new ForbiddenError(
      `FxA user id mismatch in expiring web session tokens`,
    );
  }
  return context.models.user.expireUserWebSession(args.reason);
}

/** temporary function for fxa apple migration.
 * safe to tear down code and mutation after apple migration
 * @param id
 * @param email
 * @param transferSub
 * //note: we skip the context/header info and use transferSub as source of truth.
 * not using pocket user model as this is a tear down code - as userModel loads
 * old email to data loaders.
 * @returns pocketId of the user migrated
 * @param context
 * @returns pocket user Id
 */
export async function migrateAppleUser(
  _,
  args: { fxaId: string; email: string },
  context: IContext,
): Promise<string> {
  try {
    //setting it as null as we don't know userId if we are using new fxaId
    const userDataService = new UserDataService(context, context.userId);
    const newEmail = await userDataService.validateEmail(args.email);
    await new PinpointController(context.userId).updateUserEndpointEmail(
      args.email,
    );
    await userDataService.updateUserEmailByPocketId(
      args.email,
      context.userId,
      true,
    );
    const isPremium = await userDataService.getPremiumStatusByPocketId(
      parseInt(context.userId),
    );

    context.emitUserEvent(EventType.ACCOUNT_EMAIL_UPDATED, {
      userId: context.userId,
      email: newEmail,
      isPremium,
    });

    await userDataService.upsertFxaIdByPocketId(
      args.fxaId,
      context.userId,
      args.email,
    );
    //after all the db write and event emission is done, mark the migration
    //as completed for that user
    await userDataService.markMigrationCompleted(context.transferSub);
    return context.userId;
  } catch (e) {
    serverLogger.error('migrate apple error', e);
    throw e;
  }
}
