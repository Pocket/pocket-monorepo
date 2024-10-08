import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { Resolvers } from '../__generated__/types';
import { Max300CharStringResolver } from '../models';

export const resolvers: Resolvers = {
  ...PocketDefaultScalars,
  Max300CharString: Max300CharStringResolver,
  ShareResult: {
    __resolveType(obj) {
      // Models explicitly set the typenames so we just check those
      if (obj.__typename === 'PocketShare') return 'PocketShare';
      if (obj.__typename === 'ShareNotFound') return 'ShareNotFound';
      return null; // GraphQL Error is thrown
    },
  },
  Mutation: {
    createShareLink: (_, args, context) => {
      return context.PocketShareModel.createShareLink(
        args.target,
        args.context,
      );
    },
    addShareContext: (_, args, context) => {
      return context.PocketShareModel.updateShareContext(
        args.slug,
        args.context,
      );
    },
  },
  Query: {
    shareSlug: (_, { slug }, context) => {
      return context.PocketShareModel.shareSlug(slug);
    },
  },
};
