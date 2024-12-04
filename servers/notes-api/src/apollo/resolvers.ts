import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { Resolvers } from '../__generated__/graphql';

export const resolvers: Resolvers = {
  ...PocketDefaultScalars,
  Query: {
    note(root, { id }, context) {
      return context.NoteModel.load(id);
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
  },
};
