import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import {
  SavedItem,
  SavedItemAnnotations,
  CreateHighlightInput,
  UpdateHighlightInput,
  Highlight,
  HighlightNote,
  BatchWriteHighlightsResult,
  BatchWriteHighlightsInput,
  Resolvers,
  CreateHighlightByUrlInput,
} from '../../__generated__/resolvers-types.ts';
import { IContext } from './context.ts';

export const resolvers: Resolvers = {
  ...PocketDefaultScalars,
  SavedItem: {
    annotations: async (
      parent: SavedItem,
      _,
      context: IContext,
    ): Promise<SavedItemAnnotations> => {
      return context.HighlightsModel.getByItemId(parent.id);
    },
  },
  Highlight: {
    note: async (
      parent: Highlight,
      _,
      context: IContext,
    ): Promise<HighlightNote | null> => {
      return context.dataLoaders.noteByHighlightId.load(parent.id);
    },
  },
  Mutation: {
    createSavedItemHighlights: async (
      _,
      args: { input: CreateHighlightInput[] },
      context: IContext,
    ): Promise<Highlight[]> => {
      return context.HighlightsModel.createMany(args.input);
    },
    createHighlightByUrl: async (
      _,
      args: { input: CreateHighlightByUrlInput },
      context: IContext,
    ): Promise<Highlight> => {
      return context.HighlightsModel.createOneByUrl(args.input);
    },
    updateSavedItemHighlight: async (
      _: any,
      params: { id: string; input: CreateHighlightInput },
      context: IContext,
    ): Promise<Highlight> => {
      return context.HighlightsModel.update(params.id, params.input);
    },
    updateHighlight: async (
      _: any,
      params: { id: string; input: UpdateHighlightInput },
      context: IContext,
    ): Promise<Highlight> => {
      return context.HighlightsModel.update(params.id, params.input);
    },
    deleteSavedItemHighlight: async (
      _,
      args: { id: string },
      context: IContext,
    ): Promise<string> => {
      return context.HighlightsModel.delete(args.id);
    },
    createSavedItemHighlightNote: async (
      _,
      args: { id: string; input: string },
      context: IContext,
    ): Promise<HighlightNote> => {
      return context.HighlightsModel.addNote(args.id, args.input);
    },
    updateSavedItemHighlightNote: async (
      _,
      args: { id: string; input: string },
      context: IContext,
    ): Promise<HighlightNote> => {
      return context.HighlightsModel.updateNote(args.id, args.input);
    },
    deleteSavedItemHighlightNote: async (
      _,
      args,
      context: IContext,
    ): Promise<string> => {
      return context.HighlightsModel.deleteNote(args.id);
    },
    batchWriteHighlights: async (
      _,
      args: { input: BatchWriteHighlightsInput },
      context: IContext,
    ): Promise<BatchWriteHighlightsResult> => {
      return context.HighlightsModel.batchWrite(args.input);
    },
  },
};
