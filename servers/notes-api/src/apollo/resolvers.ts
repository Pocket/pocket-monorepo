import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { Resolvers } from '../__generated__/graphql';
import { PaginationInput } from '@pocket-tools/apollo-utils';

export const resolvers: Resolvers = {
  ...PocketDefaultScalars,
  NoteConnection: {
    async totalCount(parent, _, context) {
      if (parent.totalCount != null) {
        return parent.totalCount;
      } else if ('__totalCount' in parent && parent.__totalCount != null) {
        const result = await context.db.executeQuery(parent.__totalCount);
        return result.rows[0].count;
      } else {
        return -1;
      }
    },
  },
  Query: {
    note(root, { id }, context) {
      return context.NoteModel.load(id);
    },
    notes(root, { pagination, filter, sort }, context) {
      // The GraphQL InputMaybe<> type is causing issues with
      // strict nulls; so doing some manipulation here to
      // make sure things are undefined vs. null
      const _pagination: PaginationInput = {
        ...(pagination?.after != null && { after: pagination.after }),
        ...(pagination?.first != null && { first: pagination.first }),
        ...(pagination?.last != null && { last: pagination.last }),
        ...(pagination?.before != null && { before: pagination.before }),
      };
      const opts = {
        ...(pagination != null && { pagination: _pagination }),
        ...(filter != null && { filter }),
        ...(sort != null && { sort }),
      };
      return context.NoteModel.paginate(opts);
    },
  },
  Mutation: {
    createNote(root, { input }, context) {
      return context.NoteModel.create(input);
    },
    createNoteFromQuote(root, { input }, context) {
      return context.NoteModel.fromQuote(input);
    },
    editNoteTitle(root, { input }, context) {
      return context.NoteModel.editTitle(input);
    },
    editNoteContent(root, { input }, context) {
      return context.NoteModel.editContent(input);
    },
    deleteNote(root, { input }, context) {
      return context.NoteModel.deleteNote(input);
    },
  },
};
