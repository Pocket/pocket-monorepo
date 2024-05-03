import { Knex } from 'knex';
import { IContext } from '../server/context.js';
import { knexPaginator as paginate } from '@pocket-tools/apollo-cursor-pagination';
import {
  Pagination,
  PocketSave,
  SavedItem,
  SaveTagNameConnection,
  Tag,
  TagSaveAssociation,
  TagEdge,
  SaveUpdateTagsInputDb,
} from '../types/index.js';
import { mysqlTimeString, uniqueArray } from './utils.js';
import config from '../config/index.js';
import { UsersMetaService } from './usersMetaService.js';
import { SavedItemDataService } from './savedItemsService.js';
import { TagModel } from '../models/index.js';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import { PocketSaveDataService } from './pocketSavesService.js';

/***
 * class that handles the read and write from `readitla-temp.item_tags` table.
 * note: for mutations, please pass the writeClient, otherwise there will be replication lags.
 */
export class TagDataService {
  private db: Knex;
  private readonly userId: string;
  private readonly apiId: string;
  private tagGroupQuery: Knex.QueryBuilder;
  private readonly savedItemService: SavedItemDataService;
  private readonly usersMetaService: UsersMetaService;
  private readonly pocketSaveService: PocketSaveDataService;

  constructor(
    context: IContext,
    savedItemDataService: SavedItemDataService,
    //note: for mutations, please pass the writeClient,
    //otherwise there will be replication lags.
  ) {
    this.db = context.dbClient;
    this.userId = context.userId;
    this.apiId = context.apiId;
    this.savedItemService = savedItemDataService;
    this.usersMetaService = new UsersMetaService(context);
    this.pocketSaveService = new PocketSaveDataService(context);
  }

  private getTagsByUserSubQuery(): any {
    return this.db('item_tags')
      .select(
        'tag as name',
        'tag',
        this.db.raw('MAX(id) as _cursor'),
        this.db.raw('NULL as _deletedAt'),
        this.db.raw('NULL as _version'),
        //TODO: add version and deletedAt feature to tag
      )
      .where({ user_id: parseInt(this.userId) })
      .groupBy('tag');
  }

  private getItemsByTagsAndUser(): any {
    return this.db
      .select('*')
      .from(this.getTagsByUserSubQuery().as('subQuery_tags'));
  }

  /**
   * For a given item_id, retrieves tags associated with it.
   * @param itemId
   */
  public async getTagsByUserItem(itemId: string): Promise<Tag[]> {
    const tags = await this.db('item_tags')
      .select(
        'tag as name',
        this.db.raw('NULL as _deletedAt'),
        this.db.raw('NULL as _version'),
        //TODO: add version and deletedAt feature to tag
      )
      .orderBy('id', 'desc')
      .where({ user_id: this.userId, item_id: itemId });
    return tags.map(TagModel.toGraphqlEntity);
  }

  /**
   * For a list of itemIds, retrieve tags associated with each.
   * Response is keyed on the itemId (if there are no tags,
   * associated to a given itemId key, that itemId key will
   * not be present in the response).
   * @param itemId ID of the savedItem to fetch tags for
   */
  public async batchGetTagsByUserItems(
    itemIds: string[],
  ): Promise<{ [savedItemId: string]: Tag[] }> {
    const tags = await this.db('item_tags')
      .select(
        'tag as name',
        'item_id',
        this.db.raw('NULL as _deletedAt'),
        this.db.raw('NULL as _version'),
        //TODO: add version and deletedAt feature to tag
      )
      .orderBy('id', 'desc')
      .whereIn('item_id', itemIds)
      .andWhere({ user_id: parseInt(this.userId) });

    // Aggregate list of tags by item_id
    const result = tags.reduce(
      (saveTagMap, tagRow) => {
        const itemId = tagRow['item_id'].toString();
        const tagEntity = TagModel.toGraphqlEntity(tagRow);
        if (saveTagMap[itemId]?.length > 0) {
          saveTagMap[itemId].push(tagEntity);
        } else {
          saveTagMap[itemId] = [tagEntity];
        }
        return saveTagMap;
      },
      {} as { [savedItemId: string]: Tag[] },
    );

    return result;
  }

  /**
   Returns the latest 3 tags used by the Pocket User
   TODO: DataLoader
   */
  public async getSuggestedTags(save: SavedItem | PocketSave): Promise<Tag[]> {
    const existingTags = this.db('item_tags')
      .select('tag')
      .where({ user_id: parseInt(this.userId), item_id: parseInt(save.id) });

    const latestTags = await this.db('item_tags')
      .select('tag')
      .leftJoin('readitla_ril-tmp.list', function () {
        this.on('item_tags.item_id', 'readitla_ril-tmp.list.item_id').on(
          'item_tags.user_id',
          'readitla_ril-tmp.list.user_id',
        );
      })
      .whereNotIn('tag', existingTags)
      .andWhere({ 'item_tags.user_id': parseInt(this.userId) })
      .groupBy('tag')
      // Figuring out most recently used tags is difficult due to sparse data.
      // First check time_added, which is when the tag was associated to a given
      // save. This field is often null (e.g. android) because it relies on clients
      // to pass the timestamp data, and does not have a default value.
      //
      // Fall back on the time the Save was last updated. This fallback
      // time may not be when the tag was added, but it's the best proxy we have.
      .orderByRaw('MAX(COALESCE(item_tags.time_added, list.time_updated)) DESC')
      .limit(3)
      .pluck('tag');

    const tags = await this.getTagsByUserSubQuery().whereIn('tag', latestTags);

    return tags.map(TagModel.toGraphqlEntity);
  }

  public async getTagsByName(names: string[]): Promise<Tag[]> {
    const tags = await this.getTagsByUserSubQuery().andWhere(function () {
      this.whereIn('tag', names);
    });
    return tags.map(TagModel.toGraphqlEntity);
  }

  public async getTagByName(tagName: string): Promise<Tag | undefined> {
    const result = await this.getTagsByUserSubQuery().where('tag', tagName);
    return result.length > 0
      ? result.map(TagModel.toGraphqlEntity)[0]
      : undefined;
  }

  public async getTagsByUser(
    userId: string,
    pagination?: Pagination,
  ): Promise<any> {
    pagination = pagination ?? { first: config.pagination.defaultPageSize };
    const query = this.getItemsByTagsAndUser();
    const result = await paginate(
      query,
      {
        first: pagination?.first,
        last: pagination?.last,
        before: pagination?.before,
        after: pagination?.after,
        orderBy: '_cursor',
        orderDirection: 'ASC',
      },
      {
        primaryKey: 'tag',
        modifyEdgeFn: (edge): TagEdge => ({
          ...edge,
          node: {
            ...edge.node,
          },
        }),
      },
    );

    for (const edge of result.edges) {
      edge.node = TagModel.toGraphqlEntity(edge.node);
    }
    return result;
  }

  /**
   * Insert tags into the database for items in a user's list
   * Note: does not check to ensure that the item being tagged
   * is actually in the user's list (no foreign key constraint).
   * @param tagInputs
   */
  public async insertTags(
    tagInputs: TagSaveAssociation[],
    timestamp?: Date,
  ): Promise<void> {
    const updatedTime = timestamp ?? new Date();
    await this.db.transaction(async (trx: Knex.Transaction) => {
      await this.insertTagAndUpdateSavedItem(tagInputs, trx, updatedTime);
      await this.usersMetaService.logTagMutation(updatedTime, trx);
    });
  }

  private async insertTagAndUpdateSavedItem(
    tagInputs: TagSaveAssociation[],
    trx: Knex.Transaction<any, any[]>,
    timestamp?: Date,
  ) {
    if (tagInputs.length === 0) {
      return;
    }
    const updateTimestamp = mysqlTimeString(
      timestamp ?? new Date(),
      config.database.tz,
    );
    const inputData = tagInputs.map((tagInput) => {
      return {
        user_id: parseInt(this.userId),
        item_id: parseInt(tagInput.savedItemId),
        tag: tagInput.name,
        time_added: updateTimestamp,
        time_updated: updateTimestamp,
        api_id: parseInt(this.apiId),
      };
    });
    await trx('item_tags').insert(inputData).onConflict().ignore();
    const itemIds = uniqueArray(
      tagInputs.map((element) => element.savedItemId),
    );
    await this.savedItemService.updateListItemMany(itemIds, trx, timestamp);
  }

  /**
   * Delete associations between tags and saved items.
   * All updates are performed in the same transaction.
   * @param input Specify the association pairs to remove
   */
  public async deleteSavedItemAssociations(
    input: SaveTagNameConnection[],
    timestamp?: Date,
  ): Promise<SaveTagNameConnection[]> {
    await this.db.transaction(async (trx: Knex.Transaction) => {
      const tagDeleteSubquery = trx('item_tags')
        .andWhere('user_id', this.userId)
        .delete();
      // Build array of promises to delete association row
      const deletePromises = input.map(({ tagName, savedItemId }) => {
        return tagDeleteSubquery
          .clone()
          .where({ item_id: savedItemId, tag: tagName });
      });
      await Promise.all(deletePromises);

      // Need to mark an update on the list items
      const itemIds = input.map((element) => element.savedItemId);
      await this.savedItemService.updateListItemMany(itemIds, trx, timestamp);
      // Also need to update the users_meta
      await this.usersMetaService.logTagMutation(timestamp ?? new Date(), trx);
    });
    return input;
  }

  /**
   * Completely remove a tag from the database for a user, and delete all
   * associations it has to a user's SavedItems
   * @param tagName the name of the Tag to delete
   */
  public async deleteTagObject(
    tagName: string,
    timestamp?: Date,
  ): Promise<void> {
    const affectedItems = await this.db('item_tags')
      .where({ user_id: this.userId, tag: tagName })
      .pluck('item_id');
    if (affectedItems.length > 0) {
      await this.db.transaction(async (trx: Knex.Transaction) => {
        await this.deleteTagsByName(tagName).transacting(trx);
        await this.savedItemService.updateListItemMany(
          affectedItems,
          trx,
          timestamp,
        );
        await this.usersMetaService.logTagMutation(
          timestamp ?? new Date(),
          trx,
        );
      });
    }
  }

  /**
   * updates the tag name for the given user
   * @param tagUpdateInput tagUpdate input provided in the request
   * @param itemIds
   */
  public async updateTagByUser(
    oldName: string,
    newName: string,
    itemIds: string[],
    timestamp?: Date,
  ): Promise<void> {
    await this.db.transaction(async (trx: Knex.Transaction) => {
      await trx.raw(
        `update ignore item_tags
         set tag=:newTagName,
             time_updated=:_updatedAt where user_id = :userId and tag=:oldTagName`,
        {
          newTagName: newName,
          userId: this.userId,
          oldTagName: oldName,
          _updatedAt: mysqlTimeString(
            timestamp ?? new Date(),
            config.database.tz,
          ),
        },
      );
      await this.savedItemService.updateListItemMany(itemIds, trx, timestamp);
      await this.deleteTagsByName(oldName).transacting(trx);
      await this.usersMetaService.logTagMutation(timestamp ?? new Date(), trx);
    });
  }

  /**
   * Replaces existing tags association with the input tagIds for a given savedItemId
   * Note: As there is no foreign key constraint of itemId in item_tags table, we don't
   * explicitly check if savedItemId exist before replacing the tags. So right now, we can
   * create tags for a non-existent savedItem.
   * @param inserts a list of inputs for creating new tags; every
   * input should be associated to the SAME item ID (this is handled by
   * the calling function).
   * @return savedItem savedItem whose tag got updated
   * todo: make a check if savedItemId exist before deleting.
   */
  public async updateSavedItemTags(
    inserts: TagSaveAssociation[],
    timestamp?: Date,
  ): Promise<SavedItem | null> {
    // No FK constraints so check in data service layer
    const exists =
      (await this.savedItemService.getSavedItemById(inserts[0].savedItemId)) !=
      null;
    if (!exists) {
      throw new NotFoundError(
        `SavedItem ID ${inserts[0].savedItemId} does not exist.`,
      );
    }
    await this.db.transaction(async (trx: Knex.Transaction) => {
      await this.deleteTagsByItemId(inserts[0].savedItemId).transacting(trx);

      await this.insertTagAndUpdateSavedItem(inserts, trx, timestamp);
      await this.usersMetaService.logTagMutation(new Date(), trx);
    });
    return await this.savedItemService.getSavedItemById(inserts[0].savedItemId);
  }

  /**
   * deletes all the tags associated with the given savedItem id.
   * if the tag is associated only with the give itemId, then the tag
   * will be deleted too.
   * @param savedItemId
   * @returns savedItem savedItem whose tag got removed.
   */
  public async updateSavedItemRemoveTags(
    savedItemId: string,
    timestamp?: Date,
  ): Promise<any> {
    //clear first, so we can get rid of noisy data if savedItem doesn't exist.
    await this.db.transaction(async (trx: Knex.Transaction) => {
      const count = await this.deleteTagsByItemId(savedItemId).transacting(trx);
      if (count) {
        await this.savedItemService.updateListItemOne(
          savedItemId,
          trx,
          timestamp,
        );
        await this.usersMetaService.logTagMutation(
          timestamp ?? new Date(),
          trx,
        );
      }
    });
    return await this.savedItemService.getSavedItemById(savedItemId);
  }

  /**
   * Replaces all tags associated with a given savedItem id
   * @param tagsInputs : list of TagSaveAssociation
   */
  public async replaceSavedItemTags(
    tagInputs: TagSaveAssociation[],
    timestamp?: Date,
  ): Promise<SavedItem[]> {
    const savedItemIds = Array.from(
      new Set(tagInputs.map((input) => input.savedItemId)),
    );
    await this.db.transaction(async (trx) => {
      await Promise.all(
        savedItemIds.map(async (id) => {
          await this.deleteTagsByItemId(id).transacting(trx);
        }),
      );
      await this.insertTagAndUpdateSavedItem(tagInputs, trx, timestamp);
      await this.usersMetaService.logTagMutation(new Date(), trx);
    });

    return await this.savedItemService.batchGetSavedItemsByGivenIds(
      savedItemIds,
    );
  }

  /**
   * Return the user's entire list of tags.
   * This is to support a specific v3 API and should not be reused.
   * And yes, this is a problematic query and sync strategy.
   * @param syncSince if defined, will only return the list of tags if
   * there has been a change since `syncSince`
   * @returns the user's entire list of tags, or undefined if no changes
   * have happened since syncSince
   */
  public async tagsList(syncSince?: Date): Promise<string[] | undefined> {
    const tags = this.db('item_tags')
      .select('tag')
      .distinct()
      .where('user_id', this.userId)
      .pluck('tag');
    if (syncSince != null) {
      const lastUpdate = await this.usersMetaService.lastTagMutationTime();
      const updateFallback = lastUpdate ?? new Date();
      // Per web repo, set this timestamp now if it doesn't exist to prevent extraneous syncs
      if (lastUpdate == null) {
        this.usersMetaService.upsertTagLog(updateFallback);
      }
      if (updateFallback > syncSince) {
        return tags;
      } else {
        // Don't return data if no changs since syncSince
        return undefined;
      }
    } else {
      // If no timestamp is passed we return data
      return tags;
    }
  }

  /**
   * Bulk update method for creating and deleting tags associated to a Save.
   * All SaveIds passed to this function must be valid; if any are not
   * found in the user's saves, the entire operation will be rolled
   * back and NotFound payload returned.
   * If attempting to delete a tag that does not exist,
   * the method is a "no-op" and will not result in an error.
   * @param updates payload of deletes and creates for a given saveId
   * @param timestamp timestamp for when the bulk operation occurred
   * @returns object containing the saveIds that were updated and any
   * that were missing; these arrays are mutually exclusive (so if one
   * has any values, the other will be empty).
   */
  public async batchUpdateTags(
    updates: SaveUpdateTagsInputDb,
    timestamp: Date,
  ): Promise<{ updated: number[]; missing: string[] }> {
    // First check if the save exists -- no need to initialize
    // transaction yet
    const { deletes, creates } = updates;
    const saveIds = uniqueArray(
      [...deletes, ...creates].map((req) => parseInt(req.savedItemId)),
    );
    const missing = await this.pocketSaveService.checkIdExists(saveIds);
    // Exit if there are any missing Saves, with the missing ids returned
    if (missing.length) {
      return { updated: [], missing: missing.map((id) => id.toString()) };
    }
    // Otherwise we can proceed with the write
    // We won't throw error if trying to delete a nonexistent tag (no-op)
    await this.db.transaction(async (trx) => {
      await this.deleteTagsByNameAndItemId(deletes).transacting(trx);
      await this.insertTagAndUpdateSavedItem(creates, trx, timestamp);
      await this.usersMetaService.logTagMutation(timestamp, trx);
    });
    return { updated: saveIds, missing: [] };
  }

  public async fetchItemIdAssociations(tag: string): Promise<string[]> {
    const res = await this.db('item_tags')
      .select('item_id')
      .where({ tag, user_id: this.userId })
      .pluck('item_id');
    return res as string[];
  }

  /**
   * Delete tag associations from a single saved item, by the tag name(s).
   */
  public async deleteItemTagsByName(
    tagNames: string[],
    itemId: string,
    timestamp?: Date,
  ): Promise<Knex.QueryBuilder> {
    await this.db.transaction(async (trx) => {
      await trx('item_tags')
        .whereIn('tag', tagNames)
        .andWhere({ user_id: this.userId, item_id: itemId })
        .del();
      await this.savedItemService.updateListItemOne(itemId, trx, timestamp);
      await this.usersMetaService.logTagMutation(timestamp ?? new Date(), trx);
    });
    return await this.savedItemService.getSavedItemById(itemId);
  }

  private deleteTagsByItemId(itemId: string): Knex.QueryBuilder {
    return this.db('item_tags')
      .where({ user_id: this.userId, item_id: itemId })
      .del();
  }

  private deleteTagsByName(tagName: string): Knex.QueryBuilder {
    return this.db('item_tags')
      .where({ user_id: this.userId, tag: tagName })
      .del();
  }

  /** Query builder for deleting item_tags rows by PK tuples */
  private deleteTagsByNameAndItemId(
    association: TagSaveAssociation[],
  ): Knex.QueryBuilder {
    const tuples = association.map(({ savedItemId, name }) => {
      return [parseInt(savedItemId), name, this.userId];
    });
    return this.db('item_tags')
      .del()
      .whereIn(['item_id', 'tag', 'user_id'], tuples);
  }
}
