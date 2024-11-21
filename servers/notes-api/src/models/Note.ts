import DataLoader from 'dataloader';
import { Note } from '../__generated__/graphql';
import { Note as NoteEntity } from '../__generated__/db';
import { Selectable } from 'kysely';
import { orderAndMap } from '../utils/dataloader';
import { IContext } from '../apollo/context';
import { NotesService } from '../datasources/NoteService';
import { ProseMirrorDoc } from './ProseMirrorDoc';

/**
 * Model for retrieving and creating Notes
 */
export class NoteModel {
  loader: DataLoader<string, Selectable<NoteEntity> | null>;
  service: NotesService;
  constructor(context: IContext) {
    this.service = new NotesService(context);
    this.loader = new DataLoader<string, Selectable<NoteEntity> | null>(
      async (keys: readonly string[]) => {
        const notes = await this.service.getMany(keys);
        return orderAndMap(keys, notes, 'noteId');
      },
    );
  }
  /**
   * Convert a Note response from the database into
   * the desired GraphQL object.
   * @param note
   * @returns
   */
  toGraphql(note: Selectable<NoteEntity>): Note {
    const savedItem = note.sourceUrl != null ? { url: note.sourceUrl } : null;
    return {
      createdAt: note.createdAt,
      docContent:
        note.docContent != null ? JSON.stringify(note.docContent) : null,
      id: note.noteId,
      savedItem,
      title: note.title,
      updatedAt: note.updatedAt,
      source: note.sourceUrl,
      // TODO - Non-default schema
      contentPreview:
        note.docContent != null
          ? new ProseMirrorDoc(note.docContent).preview
          : null,
      archived: note.archived,
      deleted: note.deleted,
    };
  }
  /**
   * Get multiple Notes by IDs. Prefer using `load`
   * unless you need to bypass cache behavior.
   */
  async getMany(ids: readonly string[]): Promise<Note[]> {
    const notes = await this.service.getMany(ids);
    return notes != null && notes.length > 0
      ? notes.map((note) => this.toGraphql(note))
      : [];
  }
  /**
   * Get a single note by its id.
   * Prefer using `load` unless you need to bypass cache
   * behavior. Will return null if ID does not exist
   * or is inaccessible for the user.
   */
  async getOne(id: string): Promise<Note | null> {
    const note = await this.service.get(id);
    return note != null ? this.toGraphql(note) : null;
  }
  /**
   * Get a single note by its id (using dataloader to batch load).
   * Will return null if ID does not exist or is inaccessible
   * for the user.
   */
  async load(id: string): Promise<Note | null> {
    const note = await this.loader.load(id);
    return note != null ? this.toGraphql(note) : null;
  }
}
