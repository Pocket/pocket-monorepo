import { NotFoundError } from '@pocket-tools/apollo-utils';
import { SavedItemDataService } from '../dataService';
import { ParserCaller } from '../externalCaller/parserCaller';
import { IContext } from '../server/context';
import { EventType } from '../businessEvents';
import { SavedItem } from '../types';

export class SavedItemModel {
  private readonly defaultNotFoundMessage = 'SavedItem does not exist';
  private saveService: SavedItemDataService;
  constructor(public readonly context: IContext) {
    this.saveService = new SavedItemDataService(this.context);
  }

  /**
   * 'Archive' a Save in a Pocket User's list
   * @param id the ID of the SavedItem to archive
   * @param timestamp timestamp for when the mutation occurred. Optional
   * to support old id-keyed mutations that didn't require timetsamp.
   * If not provided, defaults to current server time.
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async archiveById(
    id: string,
    timestamp?: Date,
  ): Promise<SavedItem | null> {
    const savedItem = await this.saveService.updateSavedItemArchiveProperty(
      id,
      true,
      timestamp,
    );
    if (savedItem == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    } else {
      this.context.emitItemEvent(EventType.ARCHIVE_ITEM, savedItem);
    }
    return savedItem;
  }
  /**
   * 'Unarchive' a Save in a Pocket User's list
   * @param id the ID of the SavedItem to unarchive (move to 'saves')
   * @param timestamp timestamp for when the mutation occurred. Optional
   * to support old id-keyed mutations that didn't require timetsamp.
   * If not provided, defaults to current server time.
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async unarchiveById(id: string, timestamp?: Date) {
    const savedItem = await this.saveService.updateSavedItemArchiveProperty(
      id,
      false,
      timestamp,
    );
    if (savedItem == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    } else {
      this.context.emitItemEvent(EventType.UNARCHIVE_ITEM, savedItem);
    }
    return savedItem;
  }

  /**
   * 'Favorite' a Save in a Pocket User's list
   * @param id the ID of the SavedItem to favorite
   * @param timestamp timestamp for when the mutation occurred. Optional
   * to support old id-keyed mutations that didn't require timetsamp.
   * If not provided, defaults to current server time.
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async favoriteById(
    id: string,
    timestamp?: Date,
  ): Promise<SavedItem | null> {
    const savedItem = await this.saveService.updateSavedItemFavoriteProperty(
      id,
      true,
      timestamp,
    );
    if (savedItem == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    } else {
      this.context.emitItemEvent(EventType.FAVORITE_ITEM, savedItem);
    }
    return savedItem;
  }
  /**
   * 'Unfavorite' a Save in a Pocket User's list
   * @param id the ID of the SavedItem to unfavorite (move to 'saves')
   * @param timestamp timestamp for when the mutation occurred. Optional
   * to support old id-keyed mutations that didn't require timetsamp.
   * If not provided, defaults to current server time.
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async unfavoriteById(
    id: string,
    timestamp?: Date,
  ): Promise<SavedItem | null> {
    const savedItem = await this.saveService.updateSavedItemFavoriteProperty(
      id,
      false,
      timestamp,
    );
    if (savedItem == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    } else {
      this.context.emitItemEvent(EventType.UNFAVORITE_ITEM, savedItem);
    }
    return savedItem;
  }

  /**
   * 'Soft-delete' a Save in a Pocket User's list. Removes tags, scroll
   * sync position, and attributions associated with the SavedItem, then
   * sets the status to 'deleted'.
   * @param id the ID of the SavedItem to delete
   * @param timestamp timestamp for when the mutation occurred. Optional
   * to support old id-keyed mutations that didn't require timetsamp.
   * If not provided, defaults to current server time.
   * @returns The ID of the deleted SavedItem, or null if it does not exist
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async deleteById(
    id: string,
    timestamp?: Date,
  ): Promise<string | null> {
    // TODO: setup a process to delete saved items X number of days after deleted
    await this.saveService.deleteSavedItem(id, timestamp);
    const savedItem = await this.saveService.getSavedItemById(id);
    if (savedItem == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    } else {
      this.context.emitItemEvent(EventType.DELETE_ITEM, savedItem);
    }
    return id;
  }

  /**
   * Undo the 'soft-delete' operation on a Save in a Pocket User's list.
   * Does not restore tags, scroll sync position, or attributions.
   * Does not work if the record has been 'hard-deleted' (removed from db table).
   * Restores 'archive' and 'unread' status depending on whether there
   * is a nonzero 'time_read' value (happens if the Save was archived).
   * @param id the ID of the SavedItem to undelete
   * @param timestamp timestamp for when the mutation occurred
   * @returns The restored SavedItem, or null if it does not exist
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async undeleteById(
    id: string,
    timestamp?: Date,
  ): Promise<SavedItem | null> {
    const savedItem = await this.saveService.updateSavedItemUnDelete(
      id,
      timestamp,
    );
    if (savedItem == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    }
    return savedItem;
  }

  /**
   * 'Archive' a Save in a Pocket User's list
   * @param url the given url of the SavedItem to archive
   * @param timestamp timestamp for when the mutation occurred
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async archiveByUrl(
    url: string,
    timestamp: Date,
  ): Promise<SavedItem | null> {
    const id = await this.fetchIdFromUrl(url);
    return this.archiveById(id, timestamp);
  }
  /**
   * 'Unarchive' a Save in a Pocket User's list
   * @param url the given url of the SavedItem to unarchive (move to 'saves')
   * @param timestamp timestamp for when the mutation occurred
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async unarchiveByUrl(
    url: string,
    timestamp: Date,
  ): Promise<SavedItem | null> {
    const id = await this.fetchIdFromUrl(url);
    return this.unarchiveById(id, timestamp);
  }

  /**
   * 'Favorite' a Save in a Pocket User's list
   * @param url the given url of the SavedItem to favorite
   * @param timestamp timestamp for when the mutation occurred
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async favoriteByUrl(
    url: string,
    timestamp: Date,
  ): Promise<SavedItem | null> {
    const id = await this.fetchIdFromUrl(url);
    return this.favoriteById(id, timestamp);
  }
  /**
   * 'Unfavorite' a Save in a Pocket User's list
   * @param url the given url of the SavedItem to unfavorite
   * @param timestamp timestamp for when the mutation occurred
   * @returns The updated SavedItem if it exists, or null if it doesn't
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async unfavoriteByUrl(
    url: string,
    timestamp: Date,
  ): Promise<SavedItem | null> {
    const id = await this.fetchIdFromUrl(url);
    return this.unfavoriteById(id, timestamp);
  }

  /**
   * 'Soft-delete' a Save in a Pocket User's list. Removes tags, scroll
   * sync position, and attributions associated with the SavedItem, then
   * sets the status to 'deleted'.
   * @param id the ID of the SavedItem to delete
   * @param timestamp timestamp for when the mutation occurred
   * @returns The url of the deleted SavedItem, or null if it does not exist
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async deleteByUrl(
    url: string,
    timestamp: Date,
  ): Promise<string | null> {
    const id = await this.fetchIdFromUrl(url);
    // Will throw if fails or returns null
    await this.deleteById(id, timestamp);
    return url;
  }

  /**
   * Undo the 'soft-delete' operation on a Save in a Pocket User's list.
   * Does not restore tags, scroll sync position, or attributions.
   * Does not work if the record has been 'hard-deleted' (removed from db table).
   * Restores 'archive' and 'unread' status depending on whether there
   * is a nonzero 'time_read' value (happens if the Save was archived).
   * @param url the givenUrl of the SavedItem to undelete
   * @param timestamp timestamp for when the mutation occurred
   * @returns The restored SavedItem, or null if it does not exist
   * @throws NotFound if the SavedItem doesn't exist
   */
  public async undeleteByUrl(
    url: string,
    timestamp?: Date,
  ): Promise<SavedItem | null> {
    const id = await this.fetchIdFromUrl(url);
    // Will throw if fails or returns null
    return this.undeleteById(id, timestamp);
  }

  /**
   * U
   * @param id
   * @param timestamp
   * @param title
   * @returns
   */
  public async updateTitleById(
    id: string,
    timestamp: Date,
    title: string,
  ): Promise<SavedItem | null> {
    const savedItem = await this.saveService.updateTitle(id, timestamp, title);
    if (savedItem == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    } else {
      this.context.emitItemEvent(EventType.UPDATE_TITLE, savedItem);
    }
    return savedItem;
  }

  public async updateTitleByUrl(url: string, timestamp: Date, title: string) {
    const id = await this.fetchIdFromUrl(url);
    // Will throw if fails or returns null
    return this.updateTitleById(id, timestamp, title);
  }
  /** Remove all tags from a single Saved Item, identified by ID */
  public async clearTagsById(id: string, timestamp?: Date) {
    const { save, removed } = await this.context.models.tag.removeSaveTags(
      id,
      timestamp,
    );
    if (removed.length) {
      this.context.emitItemEvent(EventType.CLEAR_TAGS, save, removed);
    }
    return save;
  }
  /** Remove all tags from a single Saved Item, identified by url */
  public async clearTagsByUrl(url: string, timestamp?: Date) {
    const id = await this.fetchIdFromUrl(url);
    return await this.clearTagsById(id, timestamp);
  }
  /** Remove tag names from a single Saved Item, identified by ID */
  public async removeTagsFromSaveById(
    id: string,
    tags: string[],
    timestamp?: Date,
  ): Promise<SavedItem> {
    const { save, removed } =
      await this.context.models.tag.removeTagNamesFromSavedItem(
        id,
        tags,
        timestamp,
      );
    this.context.emitItemEvent(EventType.REMOVE_TAGS, save, removed);
    return save;
  }
  /** Remove tag names from a single Saved Item, identified by Url */
  public async removeTagsFromSaveByUrl(
    url: string,
    tags: string[],
    timestamp?: Date,
  ): Promise<SavedItem> {
    const id = await this.fetchIdFromUrl(url);
    return await this.removeTagsFromSaveById(id, tags, timestamp);
  }

  /**
   * Given a URL, fetch the itemId associated with it from the Parser
   * service. This is part of the primary key to identify the savedItem
   * (combined with userId).
   * TODO[IN-1478]: Remove this lookup once givenUrl is indexed
   * in the list table (replace with direct db lookup by givenUrl)
   * https://getpocket.atlassian.net/browse/IN-1478
   * @returns the itemId associated with the url
   * @throws NotFound Error if the itemId does not exist
   *  for the URL in the parser service; do not trigger a parse
   *  to avoid any risk of IDs getting out of sync/multiple IDs
   *  for a savedItem record, etc. The ID should already exist
   *  if update mutations are being called on the SavedItem entity.
   */
  public async fetchIdFromUrl(url: string): Promise<string> {
    const id = await ParserCaller.getItemIdFromUrl(url);
    if (id == null) {
      throw new NotFoundError(this.defaultNotFoundMessage);
    }
    return id;
  }
}
