import DataLoader from 'dataloader';
import {
  Note,
  CreateNoteInput,
  CreateNoteFromQuoteInput,
  EditNoteTitleInput,
} from '../__generated__/graphql';
import { Note as NoteEntity } from '../__generated__/db';
import { Insertable, NoResultError, Selectable } from 'kysely';
import { orderAndMap } from '../utils/dataloader';
import { IContext } from '../apollo/context';
import { NotesService } from '../datasources/NoteService';
import { ProseMirrorDoc, wrapDocInBlockQuote } from './ProseMirrorDoc';
import { NotFoundError, UserInputError } from '@pocket-tools/apollo-utils';
import { DatabaseError } from 'pg';

/**
 * Model for retrieving and creating Notes
 */
export class NoteModel {
  loader: DataLoader<string, Selectable<NoteEntity> | null>;
  service: NotesService;
  constructor(public readonly context: IContext) {
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
  /**
   * Create a new Note.
   */
  async create(input: CreateNoteInput) {
    try {
      // At some point do more validation
      // We can move this to a scalar
      const docContent = JSON.parse(input.docContent);
      const entity: Insertable<NoteEntity> = {
        createdAt: input.createdAt ?? undefined,
        docContent,
        noteId: input.id ?? undefined,
        sourceUrl: input.source?.toString() ?? undefined,
        title: input.title ?? undefined,
        userId: this.context.userId,
        updatedAt: input.createdAt ?? undefined,
      };
      const note = await this.service.create(entity);
      return this.toGraphql(note);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new UserInputError(
          `Received malformed JSON for docContent: ${error.message}`,
        );
      } else if (error instanceof DatabaseError) {
        if (error.code === '23505' && error.constraint === 'Note_noteId_key') {
          throw new UserInputError(
            `Received duplicate value for note ID. ` +
              `Ensure you are generating v4 UUIDs and try again.`,
          );
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  /**
   * Create a new Note seeded with a blockquote (optionally with
   * an additional paragraph with the source link).
   */
  async fromQuote(input: CreateNoteFromQuoteInput) {
    try {
      const docContent = JSON.parse(input.quote);
      const options =
        input.source != null ? { source: input.source.toString() } : undefined;
      const quotedDoc = wrapDocInBlockQuote(docContent, options);
      const createInput: CreateNoteInput = {
        docContent: JSON.stringify(quotedDoc),
        createdAt: input.createdAt,
        id: input.id,
        title: input.title,
        source: input.source,
      };
      return this.create(createInput);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new UserInputError(
          `Received malformed JSON for docContent: ${error.message}`,
        );
      } else {
        throw error;
      }
    }
  }
  /**
   * Edit a note's title
   */
  async editTitle(input: EditNoteTitleInput) {
    try {
      const result = await this.service.updateTitle(
        input.id,
        input.title,
        input.updatedAt,
      );
      return this.toGraphql(result);
    } catch (error) {
      if (error instanceof NoResultError) {
        throw new NotFoundError(
          `Note with id=${input.id} does not exist or is forbidden`,
        );
      } else {
        throw error;
      }
    }
  }
}
