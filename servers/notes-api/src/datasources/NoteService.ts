import { Insertable, UpdateQueryBuilder, UpdateResult } from 'kysely';
import { IContext } from '../apollo/context';
import { DB, Note as NoteEntity } from '../__generated__/db';

/**
 * Database methods for retrieving and creating Notes
 */
export class NotesService {
  constructor(public context: IContext) {}
  /**
   * Get one Note by ID (or undefined if it does
   * not exist).
   * @param noteId
   * @returns
   */
  async get(noteId: string) {
    const result = await this.context.roDb
      .selectFrom('Note')
      .selectAll()
      .where('noteId', '=', noteId)
      .where('userId', '=', this.context.userId)
      .executeTakeFirst();
    return result;
  }
  /**
   * Get many Notes by their IDs
   * If a Note ID does not exist, it will not be
   * included. The result can possibly be an empty array.
   * @param noteIds
   * @returns
   */
  async getMany(noteIds: readonly string[]) {
    const result = await this.context.roDb
      .selectFrom('Note')
      .selectAll()
      .where('userId', '=', this.context.userId)
      .where('noteId', 'in', noteIds)
      .execute();
    return result;
  }
  /**
   * Create a new Note and return the row.
   */
  async create(entity: Insertable<NoteEntity>) {
    const result = await this.context.db
      .insertInto('Note')
      .values(entity)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result;
  }

  /**
   * Basic update builder with where statements for userId
   * and noteId baked in (avoids some repetition)
   */
  private updateBase(
    noteId: string,
  ): UpdateQueryBuilder<DB, 'Note', 'Note', UpdateResult> {
    return this.context.db
      .updateTable('Note')
      .where('noteId', '=', noteId)
      .where('userId', '=', this.context.userId);
  }
  /**
   * Update the title field in a Note
   * @param noteId the UUID of the Note entity to update
   * @param title the new title (can be empty string)
   * @param updatedAt when the update was performed
   * @returns the updated Note entity
   * @throws error if the query returned no result
   */
  async updateTitle(
    noteId: string,
    title: string,
    updatedAt?: Date | string | null,
  ) {
    const setUpdate =
      updatedAt != null
        ? { title, updatedAt }
        : { title, updatedAt: new Date(Date.now()) };
    const result = await this.updateBase(noteId)
      .set(setUpdate)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result;
  }
  /**
   * Update the docContent field in a Note
   * @param noteId the UUID of the Note entity to update
   * @param docContent JSON representation of ProseMirror document
   * (pre-validated).
   * @param updatedAt when the update was performed
   * @returns the updated Note entity
   * @throws error if the query returned no result
   */
  async updateDocContent(
    noteId: string,
    docContent: any,
    updatedAt?: Date | string | null,
  ) {
    const setUpdate =
      updatedAt != null
        ? { docContent, updatedAt }
        : { docContent, updatedAt: new Date(Date.now()) };
    const result = await this.updateBase(noteId)
      .set(setUpdate)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result;
  }
}
