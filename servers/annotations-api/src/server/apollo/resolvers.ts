import { IContext } from './context';
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
} from '../../__generated__/resolvers-types';
import { HighlightNote as HighlightNoteInternal } from '../../types';
import { HighlightsDataService } from '../../dataservices/highlights';

export const resolvers: Resolvers = {
  SavedItem: {
    annotations: async (
      parent: SavedItem,
      _,
      context: IContext,
    ): Promise<SavedItemAnnotations> => {
      const highlights = await new HighlightsDataService(context).getByItemId(
        parent.id,
      );
      return { highlights };
    },
  },
  Highlight: {
    note: async (
      parent: Highlight,
      _,
      context: IContext,
    ): Promise<HighlightNote | undefined> => {
      return context.dataLoaders.noteByHighlightId.load(parent.id);
    },
  },
  Mutation: {
    createSavedItemHighlights: async (
      _,
      args: { input: CreateHighlightInput[] },
      context: IContext,
    ): Promise<Highlight[]> => {
      const highlights = await new HighlightsDataService(context).create(
        args.input,
      );
      const noteData = args.input.reduce(
        (result, highlightInput, index) => {
          if (highlightInput.note) {
            result.push({
              id: highlights[index].id,
              text: highlightInput.note,
            });
          }
          return result;
        },
        [] as { id: string; text: string }[],
      );
      const notes =
        noteData.length > 0
          ? await context.notesService.batchCreate(noteData)
          : [];
      const noteMap = notes.map((note) => ({
        id: note.highlightId,
        data: note,
      }));
      // Attach notes back to highlights result
      const result = highlights.map((highlight) => {
        const note: HighlightNoteInternal = noteMap[highlight.id]?.data;
        return {
          ...highlight,
          note,
        };
      });
      return result;
    },
    updateSavedItemHighlight: async (
      _: any,
      params: { id: string; input: CreateHighlightInput },
      context: IContext,
    ): Promise<Highlight> => {
      const dataService = new HighlightsDataService(context);
      await dataService.update(params.id, params.input);
      return await dataService.getById(params.id);
    },
    updateHighlight: async (
      _: any,
      params: { id: string; input: UpdateHighlightInput },
      context: IContext,
    ): Promise<Highlight> => {
      const dataService = new HighlightsDataService(context);
      await dataService.update(params.id, params.input);
      return await dataService.getById(params.id);
    },
    deleteSavedItemHighlight: async (
      _,
      args,
      context: IContext,
    ): Promise<string> => {
      const highlightId = await new HighlightsDataService(context).delete(
        args.id,
      );
      return highlightId;
    },
    createSavedItemHighlightNote: async (
      _,
      args: { id: string; input: string },
      context: IContext,
    ): Promise<HighlightNote> => {
      const dataService = new HighlightsDataService(context);
      await dataService.getById(args.id);
      return context.notesService.create(args.id, args.input);
    },
    updateSavedItemHighlightNote: async (
      _,
      args: { id: string; input: string },
      context: IContext,
    ): Promise<HighlightNote> => {
      const dataService = new HighlightsDataService(context);
      await dataService.getById(args.id);
      return context.notesService.upsert(args.id, args.input);
    },
    deleteSavedItemHighlightNote: async (
      _,
      args,
      context: IContext,
    ): Promise<string> => {
      const dataService = new HighlightsDataService(context);
      await dataService.delete(args.id);
      return context.notesService.delete(args.id);
    },
    batchWriteHighlights: async (
      _,
      args: { input: BatchWriteHighlightsInput },
      context: IContext,
    ): Promise<BatchWriteHighlightsResult> => {
      const dataService = new HighlightsDataService(context);
      return await dataService.batchWrite(args.input);
    },
  },
};
