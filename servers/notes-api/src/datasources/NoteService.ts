import { IContext } from '../apollo/context';

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
}
