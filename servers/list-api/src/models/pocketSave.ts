import { PocketSave, SaveByIdResult, SaveWriteMutationPayload } from '../types';
import { IContext } from '../server/context';
import { ListResult, PocketSaveDataService } from '../dataService';
import { uniqueArray } from '../dataService/utils';
import { GraphQLResolveInfo } from 'graphql';

export class PocketSaveModel {
  private saveService: PocketSaveDataService;
  constructor(public readonly context: IContext) {
    this.saveService = new PocketSaveDataService(this.context);
  }

  /**
   * Transform List Row into PocketSave
   * @param row the List Table Row to transform
   */
  static transformListRow(row: ListResult): PocketSave {
    const result: PocketSave = {
      __typename: 'PocketSave',
      archived: row.status === 'ARCHIVED' ? true : false,
      archivedAt: row.status === 'ARCHIVED' ? row.time_read : null,
      createdAt: row.time_added,
      deletedAt: row.status === 'DELETED' ? row.time_updated : null,
      favorite: row.favorite === 1 ? true : false,
      favoritedAt: row.favorite === 1 ? row.time_favorited : null,
      givenUrl: row.given_url,
      id: row.item_id.toString(),
      resolvedId: row.resolved_id.toString() ?? null,
      status: row.status,
      title: row.title,
      updatedAt: row.time_updated,
    };

    return result;
  }

  /**
   * * Fetch PocketSave(s) by ID(s)
   * * @param ids the IDs of the PocketSaves to retrieve
   * @returns array of SaveByIdResult union type (PocketSaves and/or NotFound errors)
   */
  public async getById(ids: string[]): Promise<SaveByIdResult[]> {
    const listRows = await this.saveService.getListRowsById(ids);
    const pocketSaves = listRows.map((row) =>
      PocketSaveModel.transformListRow(row),
    );
    const missingIds = ids.filter(
      (id) => !pocketSaves.some((obj) => obj.id === id),
    );
    const missingErrors = missingIds.map((id) =>
      this.context.models.notFound.message('id', id, true),
    );
    return [...pocketSaves, ...missingErrors];
  }

  /**
   * Fetch multiple Pocket Saves by ID. Unlike PocketSave.getById,
   * will not return a not found error if unable to retrieve one
   * of the IDs.
   * This can be added if/when the bulk retrieval of pocketSave
   * entities is a union type which includes NotFound.
   * @param ids the IDs of the PocketSave to retrieve
   * @returns the PocketSave entities that were found for the given ids
   */
  public async getManyById(ids: string[]): Promise<PocketSave[]> {
    const listRows = await this.saveService.getListRowsById(ids);
    const pocketSaves = listRows.map((row) =>
      PocketSaveModel.transformListRow(row),
    );
    return pocketSaves;
  }

  /**
   * Bulk update method for archiving saves; if the save is already
   * archived, will be a no-op and no changes will occur.
   * All IDs passed to this function must be valid; if any are not
   * found in the user's saves, the entire operation will be rolled
   * back and NotFound payload returned.
   * @param ids itemIds associated to the saves to archive; must all be
   * valid or the operation will fail.
   * @param timestamp timestamp for when the bulk operation occurred
   * @param path GraphQL path for the operation
   * @returns SaveWriteMutationPayload the saves that were updated,
   * and any errors that occurred
   */
  public async saveArchive(
    ids: string[],
    timestamp: Date,
    path: GraphQLResolveInfo['path'],
  ): Promise<SaveWriteMutationPayload> {
    const uniqueIds = uniqueArray(ids.map((id) => parseInt(id)));
    const { updated, missing } = await this.saveService.archiveListRow(
      uniqueIds,
      timestamp,
    );
    const payload = this.formatSaveWriteMutationPayload(missing, updated, path);
    // TODO: Emit events
    // save.forEach((saveItem) => {
    //   this.context.emitItemEvent(EventType.ARCHIVE_ITEM, saveItem);
    // });
    // Hydrate errors path with current location
    // Resolved on saveArchive because it needs to be aware
    // of this path, not the path of the error resolver type
    return payload;
  }

  /**
   * Bulk update method for unarchiving saves; if the save is already
   * unarchived, will be a no-op and no changes will occur.
   * All IDs passed to this function must be valid; if any are not
   * found in the user's saves, the entire operation will be rolled
   * back and NotFound payload returned.
   * @param ids itemIds associated to the saves to archive; must all be
   * valid or the operation will fail.
   * @param timestamp timestamp for when the bulk operation occurred
   * @param path GraphQL path for the operation
   * @returns SaveWriteMutationPayload the saves that were updated,
   * and any errors that occurred
   */
  public async saveUnArchive(
    ids: string[],
    timestamp: Date,
    path: GraphQLResolveInfo['path'],
  ): Promise<SaveWriteMutationPayload> {
    const uniqueIds = uniqueArray(ids.map((id) => parseInt(id)));
    const { updated, missing } = await this.saveService.unArchiveListRow(
      uniqueIds,
      timestamp,
    );
    const payload = this.formatSaveWriteMutationPayload(missing, updated, path);
    // TODO: Emit events
    return payload;
  }

  /**
   * bulk favorite the saves
   * no action performed if saves are already favorited
   * any error in the batch will rollback and fail the entire batch
   * @param ids itemIds associated to the saves to favorite; must all be
   * valid or the operation will fail.
   * @param timestamp timestamp for when the bulk operation occurred
   * @param path GraphQL path for the operation
   * @returns  SaveWriteMutationPayload the saves that were updated,
   * and any errors that occurred
   */
  public async saveFavorite(
    ids: string[],
    timestamp: Date,
    path: GraphQLResolveInfo['path'],
  ): Promise<SaveWriteMutationPayload> {
    const uniqueIds = uniqueArray(ids.map((id) => parseInt(id)));
    const { updated, missing } = await this.saveService.favoriteListRow(
      uniqueIds,
      timestamp,
    );
    const payload = this.formatSaveWriteMutationPayload(missing, updated, path);
    //todo: emit event
    return payload;
  }

  /**
   * bulk unfavorite the saves
   * no action performed if saves are already unfavorited
   * any error in the batch will rollback and fail the entire batch
   * @param ids itemIds associated to the saves to unfavorite; must all be
   * valid or the operation will fail.
   * @param timestamp timestamp for when the bulk operation occurred
   * @param path GraphQL path for the operation
   * @returns  SaveWriteMutationPayload the saves that were updated,
   * and any errors that occurred
   */
  public async saveUnFavorite(
    ids: string[],
    timestamp: Date,
    path: GraphQLResolveInfo['path'],
  ): Promise<SaveWriteMutationPayload> {
    const uniqueIds = uniqueArray(ids.map((id) => parseInt(id)));
    const { updated, missing } = await this.saveService.unFavoriteListRow(
      uniqueIds,
      timestamp,
    );
    const payload = this.formatSaveWriteMutationPayload(missing, updated, path);
    //todo: emit event
    return payload;
  }

  /**
   * construct saves and errors types from the data services
   * @param missing missing savesId
   * @param updated updated saves
   * @param path mutation path
   * @returns SaveWriteMutationPayload saves updated and any errors that occurred
   * @private
   */
  private formatSaveWriteMutationPayload(
    missing: string[],
    updated: ListResult[],
    path: GraphQLResolveInfo['path'],
  ): SaveWriteMutationPayload {
    // prettier-ignore
    const errors =
      missing.length > 0
        ? missing.map((missingId) =>
          this.context.models.notFound.message('id', missingId)
        )
        : [];
    const save = updated.map((row) => PocketSaveModel.transformListRow(row));
    const resolvedErrors = errors.map((error) => ({
      ...error,
      path: this.context.models.notFound.path(path),
    }));
    return { save: save, errors: resolvedErrors };
  }
}
