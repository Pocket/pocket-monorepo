import {
  PocketDefaultScalars,
  ForbiddenError,
} from '@pocket-tools/apollo-utils';
import { IContext } from '../context';
import {
  deleteUser,
  deleteUserByFxaId,
  migrateAppleUser,
  updateUserEmailByFxaId,
  expireUserWebSessionByFxaId,
} from './mutations';
import { PremiumFeature, PremiumStatus, User } from '../types';
import { UserModel } from '../models/User';
import { UserDataService } from '../dataService/userDataService';

export const resolvers = {
  ...PocketDefaultScalars,
  Query: {
    user: async (root, args, context: IContext): Promise<UserModel> => {
      if (context.models.user == null) {
        throw new ForbiddenError('Not logged in', {
          extensions: { status: 401 },
        });
      }
      return context.models.user;
    },
  },
  User: {
    __resolveReference(userRep, context: IContext): Promise<User> {
      if (userRep.id == null) {
        throw new Error('No user id passed to resolve reference');
      }
      const dataService = new UserDataService(context, userRep.id);
      return dataService.getUserData();
    },
    // Could alternatively use parent values instead
    isPremium: (parent, args, context: IContext): Promise<boolean> => {
      // this is fragile! but it works for now...
      // when the request hits the reference resolver, `parent` is the result
      // of `__resolveReference` above (which is just an object). when the
      // request originates outside of the `__resolveReference`, `parent` is
      // a `UserModel` instance.
      // below we are ensuring that the only way to retrieve a "private"
      // property is if the userId in context (meaning from the headers)
      // matches the id of the parent object.
      if (
        !(parent instanceof UserModel) &&
        parseInt(context.userId) !== parent.id
      ) {
        throw new ForbiddenError(
          'You are not authorized to access this property',
        );
      }
      return context.models.user.isPremium;
    },
    isFxa: (parent, args, context: IContext): Promise<boolean> => {
      return parent.isFxa ?? context.models.user.isFxa;
    },
    accountCreationDate: (parent, args, context: IContext): Promise<string> => {
      return (
        parent.accountCreationDate ?? context.models.user.accountCreationDate
      );
    },
    username: (parent, args, context: IContext): Promise<string | null> => {
      // for requests through the reference resolver, `parent` will *not* be a
      // UserModel instance and we should return the value directly from the
      // parent (which is a database row).
      //
      // if parent *is* a UserModel instance, return the context's value.
      //
      // in either case, the value could be `null`.
      if (parent instanceof UserModel) {
        return context.models.user.username;
      } else {
        return parent.username;
      }
    },
    avatarUrl: (parent, args, context: IContext): Promise<string> => {
      return parent.avatarUrl ?? context.models.user.avatarUrl;
    },
    name: (parent, args, context: IContext): Promise<string> => {
      return parent.name ?? context.models.user.name;
    },
    firstName: (parent, args, context: IContext): Promise<string> => {
      return parent.firstName ?? context.models.user.firstName;
    },
    lastName: (parent, args, context: IContext): Promise<string> => {
      return parent.lastName ?? context.models.user.lastName;
    },
    description: (parent, args, context: IContext): Promise<string> => {
      return parent.description ?? context.models.user.description;
    },
    premiumStatus: (
      parent,
      args,
      context: IContext,
    ): Promise<PremiumStatus> => {
      return parent.premiumStatus ?? context.models.user.premiumStatus;
    },
    premiumFeatures: async (
      parent,
      args,
      context: IContext,
    ): Promise<PremiumFeature[] | null> => {
      const status =
        (await parent.premiumStatus) ??
        (await context.models.user.premiumStatus);
      if (status !== PremiumStatus.ACTIVE) {
        return null;
      }
      return [
        PremiumFeature.PERMANENT_LIBRARY,
        PremiumFeature.SUGGESTED_TAGS,
        PremiumFeature.PREMIUM_SEARCH,
        PremiumFeature.ANNOTATIONS,
        PremiumFeature.AD_FREE,
      ];
    },
  },
  Mutation: {
    deleteUser,
    deleteUserByFxaId,
    updateUserEmailByFxaId,
    migrateAppleUser,
    expireUserWebSessionByFxaId,
  },
};
