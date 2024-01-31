import { Knex } from 'knex';
import { IContext } from '../context';
import {
  BatchWriteHighlightsResult,
  Highlight,
  HighlightEntity,
  HighlightInput,
  HighlightUpdateInput,
} from '../types';
import { NotFoundError, UserInputError } from '@pocket-tools/apollo-utils';
import { v4 as uuid } from 'uuid';
import config from '../config';
import { groupByCount, sumByKey } from '../utils/dataAggregation';
import { UsersMeta } from './usersMeta';
import { SavedItem } from './savedItem';
import { failCallback } from '../server/routes/helper';
import { setTimeout } from 'timers/promises';
import { serverLogger } from '@pocket-tools/ts-logger';

export class HighlightsDataService {
  public readonly userId: string;
  public readonly readDb: Knex;
  public readonly writeDb: Knex;
  private readonly usersMetaService: UsersMeta;
  private readonly savedItemService: SavedItem;

  constructor(
    private context: Pick<IContext, 'db' | 'userId' | 'isPremium' | 'apiId'>,
  ) {
    this.userId = context.userId;
    this.readDb = context.db.readClient;
    this.writeDb = context.db.writeClient;
    this.usersMetaService = new UsersMeta(context);
    this.savedItemService = new SavedItem(context);
  }

  /**
   * Get annotation IDs for a given user.
   * @param offset
   * @param limit
   */
  public getAnnotationIds(offset: number, limit: number) {
    return this.writeDb('user_annotations')
      .where('user_id', this.userId)
      .orderBy('created_at', 'ASC')
      .limit(limit)
      .offset(offset)
      .pluck('annotation_id');
  }

  private async highlightsCountByItemIds(
    itemIds: number[],
  ): Promise<{ [itemId: string]: number }> {
    const result = await this.readDb<HighlightEntity>('user_annotations')
      .select('item_id')
      .groupBy('item_id')
      .whereIn('item_id', itemIds)
      .andWhere('user_id', this.userId)
      .andWhere('status', 1)
      .count<{ item_id: string; count: number }[]>('* as count');
    return result.reduce((acc, row) => {
      acc[row.item_id.toString()] = row.count;
      return acc;
    }, {});
  }

  /**
   * Get highlights associated with an item in a user's list
   * if there are no highlights on a given itemId
   * @param itemId the itemId in the user's list
   * @throws NotFoundError if the itemId doesn't exist in the user's list
   */
  public async getByItemId(itemId: string): Promise<Highlight[]> {
    const rows = await this.readDb<HighlightEntity>('user_annotations')
      .select()
      .where('item_id', itemId)
      .andWhere('user_id', this.userId)
      .andWhere('status', 1);

    if (rows.length > 0) {
      return rows.map(this.toGraphql);
    }
    return [];
  }

  /**
   * Check whether the requested number of highlights would exceed the
   * highlight limit, taking into account active (status=1) highlights
   * already associated to the item in the database.
   * Only necessary to run this check for non-premium users.
   * @param highlightInput input to create highlight mutation
   * @throws UserInputError if the requested highlights would exceed
   * the limit for any item
   * @returns void if validation passes
   */
  private async checkHighlightLimit(highlightInput: HighlightInput[]) {
    // Compute the total requested highlights by itemId
    const additionalCounts = groupByCount(highlightInput, 'itemId');
    const uniqueItemIds = Object.keys(additionalCounts).map(parseInt);
    // Get current highlight count by itemId
    const currentCounts = await this.highlightsCountByItemIds(uniqueItemIds);
    // Add the two counts together to get the desired totals
    const totalDesiredCounts = sumByKey(currentCounts, additionalCounts);
    const exceedsLimit = Object.entries(totalDesiredCounts).find(
      ([_, count]) => count > config.basicHighlightLimit,
    );
    if (exceedsLimit != null) {
      throw new UserInputError(
        `Too many highlights for itemId: ${exceedsLimit[0]}`,
      );
    }
  }

  /**
   * Create highlights associated to items in the user's list
   * Enforces the limit on highlights per item for non-premium users
   * by checking the current highlights stored in the database.
   * This method is atomic -- if any request in the highlightInput
   * batch would violate the highlight limit, the entire batch will
   * fail.
   * Does not check whether the Item exists in the user's list, as
   * this is reasonable to assume from the way the client generates
   * the API request.
   * @param highlightInput
   * @param trx Optionally, a transaction object.
   * Can be used to chain multiple operations.
   * If one is not given, a new transaction will be opened.
   * @returns The Highlights created
   */
  public async create(
    highlightInput: HighlightInput[],
    trx?: Knex.Transaction,
  ): Promise<Highlight[]> {
    // Ensure non-premium users don't exceed highlight limits
    // Will throw error here if validation fails
    if (!this.context.isPremium) {
      await this.checkHighlightLimit(highlightInput);
    }
    const transaction = trx ?? (await this.writeDb.transaction());

    try {
      const rows = await this._create(highlightInput, transaction);
      await transaction.commit();
      return rows.map(this.toGraphql);
    } catch (error) {
      // Just in case, roll back if not already done
      if (!transaction.isCompleted()) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * The transaction/query logic for highlights creation.
   * The calling function MUST handle committing the transaction.
   * The transaction will be automatically rolled back if the database
   * encounters errors.
   * @param highlightInput
   * @param trx
   * @returns
   */
  private async _create(
    highlightInput: HighlightInput[],
    trx: Knex.Transaction,
    fromBatch: boolean = false,
  ) {
    const formattedHighlights = highlightInput.map((highlight) =>
      this.toDbEntity(highlight),
    );
    // Insert into the db
    await trx<HighlightEntity>('user_annotations').insert(formattedHighlights);

    const updateDate = new Date();
    // Mark saved item(s) as updated
    // There could be more than one, update all respective saved items
    await Promise.all(
      highlightInput.map(async (input) => {
        await this.savedItemService.markUpdate(input.itemId, updateDate, trx);
      }),
    );

    if (!fromBatch) {
      // Update users_meta table
      await this.usersMetaService.logAnnotationMutation(updateDate, trx);
    }

    // Query back the inserted rows
    return trx<HighlightEntity>('user_annotations')
      .select()
      .whereIn(
        'annotation_id',
        formattedHighlights.map((highlight) => highlight.annotation_id),
      );
  }

  /**
   * Update highlight for a given ID
   * @param id
   * @param input
   */
  public async update(
    id: string,
    input: HighlightInput | HighlightUpdateInput,
  ): Promise<void> {
    const annotation = await this.getById(id);

    await this.writeDb.transaction(async (trx: Knex.Transaction) => {
      await trx('user_annotations')
        .update({
          quote: input.quote,
          patch: input.patch,
          version: input.version,
          item_id: input.itemId,
          updated_at: new Date(),
        })
        .where('annotation_id', annotation.id)
        .andWhere('user_id', this.userId);

      const updateDate = new Date();
      // Mark saved item as updated
      await this.savedItemService.markUpdate(input.itemId, updateDate, trx);
      // Update users_meta table
      await this.usersMetaService.logAnnotationMutation(updateDate, trx);
    });
  }

  /**
   * Get highlight for a given ID and format returned data to match GraphQL spec
   * @param id
   */
  public async getById(id: string): Promise<Highlight> {
    const row = await this.getHighlightByIdQuery(id);

    return this.toGraphql(row);
  }

  /**
   * Get highlight by a given ID
   * @param id
   * @private
   */
  private async getHighlightByIdQuery(id: string): Promise<HighlightEntity> {
    const row = (await this.readDb<HighlightEntity>('user_annotations')
      .select()
      .where('annotation_id', id)
      .andWhere('user_id', this.userId)
      .first()) as HighlightEntity;

    if (!row) {
      throw new NotFoundError('No annotation found for the given ID');
    }
    return row;
  }

  /**
   * Delete highlight for a given ID
   * @param highlightId
   * @param trx Optionally, a transaction object.
   * Can be used to chain multiple operations.
   * If one is not given, a new transaction will be opened.
   */
  public async delete(
    highlightId: string,
    trx?: Knex.Transaction,
  ): Promise<string> {
    const annotation = await this.getHighlightByIdQuery(highlightId);
    const transaction = trx ?? (await this.writeDb.transaction());
    try {
      const result = await this._delete(highlightId, annotation, transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      // Just in case, roll back if not already done
      if (!transaction.isCompleted()) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  private async _delete(
    highlightId: string,
    annotation: HighlightEntity,
    trx: Knex.Transaction,
    fromBatch: boolean = false,
  ) {
    // This will throw and error if it doesn't like you
    await this.writeDb<HighlightEntity>('user_annotations')
      .update({ status: 0 })
      .where('user_id', this.userId)
      .andWhere('annotation_id', highlightId);

    const updateDate = new Date();
    // Mark saved item as updated
    await this.savedItemService.markUpdate(
      annotation.item_id.toString(),
      updateDate,
      trx,
    );
    // Update users_meta table
    if (!fromBatch) {
      await this.usersMetaService.logAnnotationMutation(updateDate, trx);
    }

    return highlightId;
  }

  /**
   * Delete data by annotation ids and userId.
   * Typically used when a Pocket User deletes their account.
   * Called by the batchDelete handler.
   * Deletes one row at a time, sleep for `deleteDelayInMilliSec`.
   * If delete fails, log error and move on to the next row for deletion.
   */
  public async deleteByAnnotationIds(
    annotationIds: string[],
    requestId: string,
  ) {
    for (const id of annotationIds) {
      try {
        await this.writeDb('user_annotations')
          .delete()
          .where('annotation_id', id)
          .andWhere({ user_id: this.userId });

        serverLogger.info(
          `deleted row from table user_annotations for ` +
            `user: ${this.userId} and annotation_id: ${id}; requestId: ${requestId}`,
        );
        await setTimeout(config.batchDelete.deleteDelayInMilliSec);
      } catch (error) {
        serverLogger.error(error);
        failCallback(
          'batchDelete',
          error,
          'Annotations',
          this.userId,
          requestId,
          id,
        );
      }
    }
  }

  /**
   * Function for creating and deleting highlights in a batch.
   * The batch is executed in one transaction, so it is atomic --
   * either all deletes/creates succeed or fail.
   * The exception is attempting to delete a non-existant highlight.
   * This is a no-op and will just return as though it was successful.
   * @param deletes
   * @param creates
   * @returns
   */
  public async batchWrite(
    deletes: string[],
    creates: HighlightInput[],
  ): Promise<BatchWriteHighlightsResult> {
    const trx = await this.writeDb.transaction();
    const updateDate = new Date();

    try {
      await Promise.all(
        deletes.map(async (deleteId) => {
          try {
            const annotation = await this.getHighlightByIdQuery(deleteId);
            await this._delete(deleteId, annotation, trx, true);
            // If the highlight doesn't exist, deleting is a no-op (don't return error)
          } catch (error) {
            if (error instanceof NotFoundError) {
              return;
            } else {
              throw error;
            }
          }
        }),
      );
      const created = creates.length
        ? (await this._create(creates, trx, true)).map((highlight) =>
            this.toGraphql(highlight),
          )
        : [];
      await this.usersMetaService.logAnnotationMutation(updateDate, trx);
      await trx.commit();
      return { deleted: deletes, created };
    } catch (error) {
      if (!trx.isCompleted()) {
        await trx.rollback();
      }
      throw error;
    }
  }

  /**
   * Convert DB object type to the GraphQL schema type
   * @param entity
   * @private
   */
  private toGraphql(entity: HighlightEntity): Highlight {
    return {
      id: entity.annotation_id,
      quote: entity.quote,
      patch: entity.patch,
      version: entity.version,
      _createdAt: entity.created_at.getTime() / 1000,
      _updatedAt: entity.updated_at.getTime() / 1000,
    };
  }

  /**
   * Convert Create or Update highlight input to database entity
   * that can be inserted/updated.
   * Status is set to 1, so should not be used to delete or modify
   * deleted highlights.
   * If an ID is not provided, a UUID will be auto-generated.
   * @param input HighlightInput from create or update mutation
   * @param id Optional string ID, for updating an existing highlight.
   * If provided, will use this ID instead of generating a new one.
   * @returns HighlightEntity object (minus DB default fields created_at
   * and updated_at) which can be used for insert/updating the highlight
   * entry in the table.
   */
  private toDbEntity(
    input: HighlightInput,
  ): Omit<HighlightEntity, 'created_at' | 'updated_at'> {
    return {
      annotation_id: input.id ?? uuid(),
      user_id: parseInt(this.userId),
      item_id: parseInt(input.itemId),
      quote: input.quote,
      patch: input.patch,
      version: input.version,
      status: 1,
    };
  }
}
