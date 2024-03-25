import { NotFoundError, UserInputError } from '@pocket-tools/apollo-utils';
import { IContext } from '../server/context';
import { SavedItemDataService } from '../dataService';

/**
 * Implementing @oneOf on the backend for SavedItemRef input.
 * Requires one of either `id` or `url` to be present, then
 * fetches data to fill the other value (if it exists).
 * Adding this vs. refactoring models/resolvers because oneOf
 * support is in the works, and because this subgraph is likely
 * to see more changes. So for now this is just used to help support
 * v3 API proxy, which can use either ID or Url as an identifier for
 * all mutations.
 * @throws NotFoundError if no SavedItem can be found with the
 * identifier provided
 * @throws BadUserInputError if neither `id` nor `url` are included
 * in the input.
 */
export class SavedItemRef {
  private constructor(
    public readonly id: string,
    public readonly url: string,
  ) {}

  private static validateInput(ref: { id?: string; url?: string }) {
    if (ref.id == null && ref.url == null) {
      throw new UserInputError(
        `Must provide one of either 'id' or 'url' to input 'SavedItemRef'`,
      );
    }
  }
  /** Use to have access to both the ID and Url of an extant SavedItem */
  static async resolve(
    ref: { id?: string; url?: string },
    context: IContext,
  ): Promise<SavedItemRef> {
    // Duplicative, but more obvious than relying on internal function
    SavedItemRef.validateInput(ref);
    if (ref.id != null) {
      const url = await SavedItemRef.resolveUrl(ref, context);
      return new SavedItemRef(ref.id, url);
    } else {
      const id = await SavedItemRef.resolveId(ref, context);
      return new SavedItemRef(id, ref.url);
    }
  }
  /**
   * Use when you just need to have access to the ID of an extant SavedItem
   * (but the input object might only provide URL)
   */
  static async resolveId(
    ref: { id?: string; url?: string },
    context: IContext,
  ) {
    SavedItemRef.validateInput(ref);
    const service = new SavedItemDataService(context);
    if (ref.id != null) {
      return ref.id;
    } else {
      const id = (await service.getSavedItemByGivenUrl(ref.url))?.id;
      if (id == null) {
        throw new NotFoundError(`SavedItem url: ${ref.url}`);
      }
      return id;
    }
  }
  /**
   * Use when you just need to have access to the URL of an extant SavedItem
   * (but the input object might only provide ID)
   */
  static async resolveUrl(
    ref: { id?: string; url?: string },
    context: IContext,
  ) {
    SavedItemRef.validateInput(ref);
    if (ref.id != null) {
      const service = new SavedItemDataService(context);
      const url = (await service.getSavedItemById(ref.id))?.url;
      if (url == null) {
        throw new NotFoundError(`SavedItem id: ${ref.id}`);
      }
      return url;
    }
  }
}
