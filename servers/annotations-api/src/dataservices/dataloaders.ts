import DataLoader from 'dataloader';
import { HighlightNote } from '../types.ts';
import { NotesDataService } from './notes.ts';

/**
 * Function for initializing dataloader. This function should be
 * called when the context is constructed to create a new dataloader
 * instance for each request.
 * @param client DynamoDB Client to use inside NotesDataService
 * @param context
 * @returns DataLoader which loads HighlightNote objects by highlightId string key
 */
export function createNotesLoader(
  notesService: NotesDataService,
): DataLoader<string, HighlightNote | null> {
  return new DataLoader<string, HighlightNote | null>(
    async (keys: string[]) => {
      const notes = await notesService.getMany(keys);
      // there might be missing/different ordered keys
      // we need these to be explicitly included, even if undefined,
      // so that the response has the same expected length and order
      return orderAndMapNotes(keys, notes);
    },
  );
}

/**
 * Function for reordering keys in case the order is not preserved when loading,
 * or some keys are missing.
 * Public for testing. Not intended to be used outside of the notes dataloader.
 * @param keys keys passed to the dataloader
 * @param notesResponse the response from the server/cache containing the data
 * @returns an array of notes (or undefined) that match the shape of the keys input
 */
export function orderAndMapNotes(
  keys: string[],
  notesResponse: HighlightNote[],
): Array<HighlightNote | null> {
  const noteKeyMap = notesResponse.reduce((keyMap, currentNote) => {
    keyMap[currentNote.highlightId] = currentNote;
    return keyMap;
  }, {});
  return keys.map((key) => noteKeyMap[key]);
}
