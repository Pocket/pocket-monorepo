import { PaginationInput } from '@pocket-tools/apollo-utils';
import {
  NoteFilterInput,
  NoteSortInput,
  SavedItemNoteFilterInput,
} from '../__generated__/graphql';
import { IContext } from '../apollo';
import { NoteConnectionModel, NoteModel } from './Note';

/**
 * Model for resolving note-related fields
 * on a SavedItem entity.
 */
export class SavedItemModel {
  constructor(
    public readonly url: string,
    public readonly context: IContext,
  ) {}
  /**
   * Paginate over a note connection, filtered only to
   * notes attached to thie save (plus other optional filters).
   * @param opts pagination options
   * @returns NoteConnectionModel
   */
  async notes(opts: {
    sort?: NoteSortInput;
    filter?: SavedItemNoteFilterInput;
    pagination?: PaginationInput;
  }): Promise<NoteConnectionModel> {
    const noteModel = new NoteModel(this.context);
    const filter: (NoteFilterInput & { sourceUrl: string }) | undefined =
      opts.filter != null
        ? {
            ...opts.filter,
            sourceUrl: this.url,
          }
        : { sourceUrl: this.url };
    return await noteModel.paginate({
      sort: opts.sort,
      filter: filter,
      pagination: opts.pagination,
    });
  }
}
