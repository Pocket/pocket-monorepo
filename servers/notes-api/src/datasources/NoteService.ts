import { Insertable, UpdateQueryBuilder, UpdateResult } from 'kysely';
import { IContext } from '../apollo/context';
import { DB, Note as NoteEntity } from '../__generated__/db';
import { NoteFilterInput } from '../__generated__/graphql';

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
  /**
   * Update the title field in a Note
   * @param noteId the UUID of the Note entity to update
   * @param title the new title (can be empty string)
   * @param updatedAt when the update was performed
   * @returns
   */
  async delete(noteId: string, deletedAt?: Date | string | null) {
    const setUpdate =
      deletedAt != null
        ? { deleted: true, updatedAt: deletedAt }
        : { deleted: true, updatedAt: new Date(Date.now()) };
    const result = await this.updateBase(noteId)
      .set(setUpdate)
      .returning('noteId')
      .executeTakeFirstOrThrow();
    return result.noteId;
  }

  /**
   * Update the archive field in a Note to true.
   * Does not throw error if it is already true.
   * @param noteId the UUID of the Note entity to update
   * @param updatedAt when the update was performed
   * @returns the updated Note entity
   * @throws error if the query returned no result
   */
  async archive(noteId: string, updatedAt?: Date | string | null) {
    const setUpdate =
      updatedAt != null
        ? { archived: true, updatedAt }
        : { archived: true, updatedAt: new Date(Date.now()) };
    const result = await this.updateBase(noteId)
      .set(setUpdate)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result;
  }

  /**
   * Update the archive field in a Note to false.
   * Does not throw error if it is already false.
   * @param noteId the UUID of the Note entity to update
   * @param updatedAt when the update was performed
   * @returns the updated Note entity
   * @throws error if the query returned no result
   */
  async unarchive(noteId: string, updatedAt?: Date | string | null) {
    const setUpdate =
      updatedAt != null
        ? { archived: false, updatedAt }
        : { archived: false, updatedAt: new Date(Date.now()) };
    const result = await this.updateBase(noteId)
      .set(setUpdate)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result;
  }

  /**
   * Build a base kysely query with filters applied from
   * NoteFilterInput, e.g. for paginating notes from a user
   * @param filters filters to apply to query
   * @returns SelectQueryBuilder with filters applied in where statement(s)
   */
  filterQuery(
    filters: (NoteFilterInput & { sourceUrl?: string | undefined }) | undefined,
  ) {
    let qb = this.context.db
      .selectFrom('Note')
      .selectAll()
      .where('userId', '=', this.context.userId);
    if (filters != null) {
      qb = qb.where(({ and, eb }) => {
        const conditions = Object.entries(filters).map(([key, value]) => {
          switch (key) {
            case 'archived': {
              return typeof value === 'boolean'
                ? eb(key, '=', value)
                : undefined;
            }
            case 'isAttachedToSave': {
              return value === true
                ? eb('sourceUrl', 'is not', null)
                : eb('sourceUrl', 'is', null);
            }
            case 'since': {
              if (value instanceof Date) {
                return eb('updatedAt', '>', value);
              } else if (typeof value === 'string') {
                return eb('updatedAt', '>', new Date(value));
              } else {
                return undefined;
              }
            }
            case 'excludeDeleted': {
              return value === true ? eb('deleted', '=', false) : undefined;
            }
            case 'sourceUrl': {
              return value != null && typeof value === 'string'
                ? eb('sourceUrl', '=', value)
                : undefined;
            }
          }
        });
        return and(conditions.filter((_) => _ != null));
      });
    }
    return qb;
  }
}
