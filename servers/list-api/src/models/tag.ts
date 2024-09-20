import {
  SavedItemTagUpdateInput,
  Tag,
  SavedItem,
  TagSaveAssociation,
  SaveTagNameConnection,
  DeleteSavedItemTagsInput,
  TagUpdateInput,
  SavedItemTagsInput,
  DeleteSaveTagResponse,
  PocketSave,
  SaveUpdateTagsInputGraphql,
  SaveUpdateTagsInputDb,
  SaveWriteMutationPayload,
  SavedItemTagInput,
} from '../types';
import config from '../config';
import { IContext } from '../server/context';
import { SavedItemDataService, TagDataService } from '../dataService';
import { NotFoundError, UserInputError } from '@pocket-tools/apollo-utils';
import { addslashes } from 'locutus/php/strings';
import * as Sentry from '@sentry/node';
import { GraphQLResolveInfo } from 'graphql';
import { ParserCaller } from '../externalCaller/parserCaller';
import { EventType } from '../businessEvents';

export class TagModel {
  private tagService: TagDataService;
  private saveService: SavedItemDataService;
  private parserCaller: ParserCaller;
  constructor(public readonly context: IContext) {
    this.saveService = new SavedItemDataService(this.context);
    this.tagService = new TagDataService(this.context, this.saveService);
  }

  /**
   * Convert data layer response to GraphQL Tag entity
   * Ensures the required fields are there.
   * This is mostly to catch developer error since the
   * data model in the db does not match the GraphQL entity
   */
  public static toGraphqlEntity(tagResponse: any): Tag {
    validateTag(tagResponse);
    return tagResponse;
  }

  /**
   * Generate the ID from the DB representation of tag association
   * Centralizing this logic since it is not modeled in the DB
   *
   * @param parent parent Tag entity resolving the ID on
   * @returns the generated ID for the Tag
   */
  public resolveId(parent: Tag): string {
    return TagModel.encodeId(parent.name);
  }

  /**
   * Decode the ID generated from the tag name text
   * @param id the ID to decode
   * @returns the tag name text
   */
  public static decodeId(id: string): string {
    const decoded = Buffer.from(id, 'base64').toString();
    const replace = `${config.data.tagIdSuffix}$`;
    const regex = new RegExp(replace);
    return decoded.replace(regex, '');
  }

  /**
   * Encode an ID from a tag's name text
   * @param name the tag name text
   * @returns the encoded ID
   */
  public static encodeId(name: string): string {
    return Buffer.from(name + config.data.tagIdSuffix).toString('base64');
  }

  /**
   * Associate one or more tags to a save
   */
  public async createTagSaveConnections(
    inputs: SavedItemTagsInput[],
    timestamp?: Date,
  ): Promise<SavedItem[]> {
    const creates: TagSaveAssociation[] = sanitizeTagSaveAssociation(
      inputs.flatMap((input) =>
        input.tags.map((name) => ({
          savedItemId: input.savedItemId,
          name,
        })),
      ),
    );
    await this.tagService.insertTags(creates, timestamp);
    const saveIds = creates.map((_) => _.savedItemId);
    return this.saveService.batchGetSavedItemsByGivenIds(saveIds);
  }

  /**
   * Associate one or more tags to a save, by URL.
   * @param input The list of tags to add to a SavedItem (identified by URL)
   * @throws NotFoundError if the SavedItem does not exist in the user's saves
   * @returns The updated SavedItem entity
   */
  public async createSavedItemTagConnections(
    input: SavedItemTagInput,
    timestamp: Date,
  ): Promise<SavedItem> {
    const { givenUrl, tagNames } = input;
    // TODO[IN-1478]: Remove this lookup once givenUrl is indexed
    // in the list table (replace with direct db update by givenUrl)
    // https://getpocket.atlassian.net/browse/IN-1478
    const savedItemId = await ParserCaller.getItemIdFromUrl(givenUrl);
    if (savedItemId == null) {
      throw new NotFoundError(
        `SavedItem with givenUrl='${givenUrl}' does not exist.`,
      );
    }
    const creates: TagSaveAssociation[] = sanitizeTagSaveAssociation(
      tagNames.map((name) => ({
        savedItemId,
        name,
      })),
    );
    await this.tagService.insertTags(creates, timestamp);
    const savedItem = await this.saveService.getSavedItemById(savedItemId);
    // Emit events
    this.context.emitItemEvent(EventType.ADD_TAGS, savedItem, tagNames);
    return savedItem;
  }

  /**
   * Replace the tags associated with a save
   */
  public updateTagSaveConnections(
    updates: SavedItemTagUpdateInput,
    timestamp?: Date,
  ): Promise<SavedItem> {
    const creates: TagSaveAssociation[] = updates.tagIds.map((tagId) => {
      return {
        name: TagModel.decodeId(tagId),
        savedItemId: updates.savedItemId,
      };
    });
    const sanitized = sanitizeTagSaveAssociation(creates);
    const sanitizedIds = sanitized.map(({ savedItemId }) => savedItemId);
    // Validate just in case
    const deleteFromSaveId = new Set(sanitizedIds);
    if (deleteFromSaveId.size !== 1) {
      throw new UserInputError('Cannot update Tags on multiple Saves');
    }
    return this.tagService.updateSavedItemTags(sanitized, timestamp);
  }

  /**
   * Replace the tags associated with one or more saves in
   * in a single batch.
   */
  public replaceTagSaveConnections(
    tags: TagSaveAssociation[],
    timestamp?: Date,
  ) {
    const sanitizedInput = sanitizeTagSaveAssociation(tags);
    return this.tagService.replaceSavedItemTags(sanitizedInput, timestamp);
  }

  /**
   * Fetch a Tag by its ID
   * @param id the ID of the Tag to retrieve
   * @throws NotFoundError if the record does not exist
   * @returns the Tag entity
   */
  public getById(id: string): Promise<Tag> {
    const name = TagModel.decodeId(id);
    const tag = this.tagService.getTagByName(name);
    if (tag == null) {
      throw new NotFoundError(`Tag with ID=${id} does not exist.`);
    }
    return tag;
  }

  public async getBySaveId(id: string): Promise<Tag[]> {
    return this.tagService.getTagsByUserItem(id);
  }

  /**
   * Get paginated saved item tags
   * @param parent
   */
  public async getSuggestedBySaveId(parent: PocketSave): Promise<Tag[] | []> {
    if (!this.context.userIsPremium) {
      // Suggested Tags is a premium feature.
      return [];
    }

    return this.tagService.getSuggestedTags(parent);
  }

  /**
   * Remove one or more tags from one or more saves, in a batch.
   * @param deletes delete requests
   * @returns the updated saves, with the list of tag names deleted
   */
  public async deleteTagSaveConnection(
    deletes: DeleteSavedItemTagsInput[],
    timestamp?: Date,
  ): Promise<DeleteSaveTagResponse[]> {
    // Explode tag ids list keyed on Save into list of save:tagName
    const nameConnections: SaveTagNameConnection[] = deletes.flatMap((save) =>
      save.tagIds.map((tagId) => ({
        savedItemId: save.savedItemId,
        tagName: TagModel.decodeId(tagId),
      })),
    );
    const saveIds = deletes.map((_) => _.savedItemId);
    await this.tagService.deleteSavedItemAssociations(
      nameConnections,
      timestamp,
    );
    const saves = await this.saveService.batchGetSavedItemsByGivenIds(saveIds);
    return deletes.map((del) => ({
      removed: del.tagIds.map(TagModel.decodeId),
      save: saves.find((save) => del.savedItemId === save.id.toString()),
    }));
  }

  /**
   * Remove tags by name from a single SavedItem.
   */
  public async removeTagNamesFromSavedItem(
    itemId: string,
    tagNames: string[],
    timestamp?: Date,
  ): Promise<DeleteSaveTagResponse> {
    const save = await this.tagService.deleteItemTagsByName(
      tagNames,
      itemId,
      timestamp,
    );
    return { removed: tagNames, save };
  }

  /**
   * Rename a tag entity. Propogates to all saves it is associated to.
   * @param tag the ID of the tag and its new name
   * @returns the updated Tag
   */
  public async renameTag(tag: TagUpdateInput): Promise<Tag> {
    const oldTag = await this.getById(tag.id);
    if (oldTag == null) {
      throw new NotFoundError(`Tag Id ${tag.id} does not exist`);
    }
    const newName = sanitizeTagName(tag.name);
    const savedItems = await this.getItemIdAssociations(oldTag.name);
    await this.tagService.updateTagByUser(oldTag.name, newName, savedItems);
    return this.tagService.getTagByName(newName);
  }

  public async renameTagByName(
    oldName: string,
    newName: string,
    timestamp?: Date,
  ): Promise<Tag> {
    const newNameSanitized = sanitizeTagName(newName);
    const savedItems = await this.getItemIdAssociations(oldName);
    await this.tagService.updateTagByUser(
      oldName,
      newNameSanitized,
      savedItems,
      timestamp,
    );
    const tag = await this.tagService.getTagByName(newName);
    if (tag == null) {
      throw new NotFoundError('Tag not found');
    }
    return tag;
  }

  /**
   * Delete a Tag. Removes all associations with any saves.
   * @param id the Tag ID to delete
   * @returns the id
   */
  public async deleteTag(id: string): Promise<string> {
    const name = TagModel.decodeId(id);
    await this.tagService.deleteTagObject(name);
    return id;
  }

  /**
   * Delete a Tag. Removes all associations with any saves.
   * @param name the Tag name to delete
   * @returns the name
   */
  public async deleteTagByName(
    name: string,
    timestamp?: Date,
  ): Promise<string> {
    await this.tagService.deleteTagObject(name, timestamp);
    return name;
  }

  /**
   * Clear all tags from a Save
   * @param saveId the Save to clear tags from
   * @throws NotFoundError if the Save does not exist
   * @returns the updated Save and a list of tag names removed
   */
  public async removeSaveTags(
    saveId: string,
    timestamp?: Date,
  ): Promise<DeleteSaveTagResponse> {
    const tagsCleared = await this.tagService.getTagsByUserItem(saveId);
    const removed = tagsCleared.map((_) => _.name);
    const save = await this.tagService.updateSavedItemRemoveTags(
      saveId,
      timestamp,
    );
    if (save == null) {
      throw new NotFoundError(`SavedItem Id ${saveId} does not exist`);
    }
    return { save, removed };
  }

  /**
   * Replace the tags associated with one or more saves in
   * in a single batch.
   */
  public async replaceSaveTagConnections(
    replacements: SavedItemTagsInput[],
    timestamp?: Date,
  ): Promise<SavedItem[]> {
    const tagCreates: TagSaveAssociation[] = replacements.flatMap(
      (replacement) =>
        replacement.tags.map((tag) => ({
          savedItemId: replacement.savedItemId,
          name: sanitizeTagName(tag),
        })),
    );
    return await this.tagService.replaceSavedItemTags(tagCreates, timestamp);
  }
  // TODO: These weren't required for the ID thing
  //   public getPage(pagination: Pagination): Promise<TagConnection> {}
  //   public getSuggestedTags() {}
  //   public getBySave() {}
  //   public removeTagSaveConnections {}

  /**
   * Bulk update method for creating and deleting tags associated to a Save.
   * All SaveIds passed to this function must be valid; if any are not
   * found in the user's saves, the entire operation will be rolled
   * back and NotFound payload returned.
   * If attempting to delete a tag that does not exist,
   * the method is a "no-op" and will not result in an error.
   * @param updates payload of deletes and creates for a given saveId
   * @param timestamp timestamp for when the bulk operation occurred
   * @returns the saves that were updated, and any errors that occurred
   */
  public async batchUpdateTagConnections(
    input: SaveUpdateTagsInputGraphql[],
    timestamp: Date,
    path: GraphQLResolveInfo['path'],
  ): Promise<SaveWriteMutationPayload> {
    const maxNodes = config.mutationInputLimits.batchUpdateTagNodesMax;
    const batchUpdate = this.formatBatchUpdateInput(input);
    const requestedNodes =
      batchUpdate.deletes.length + batchUpdate.creates.length;
    if (requestedNodes > maxNodes) {
      throw new UserInputError(
        `Maximum number of operations exceeded (received=${requestedNodes}, max=${maxNodes})`,
      );
    }
    const { updated, missing } = await this.tagService.batchUpdateTags(
      batchUpdate,
      timestamp,
    );
    let save: PocketSave[] = [];
    if (updated.length) {
      const ids = updated.map((update) => update.toString());
      save = await this.context.models.pocketSave.getManyById(ids);
    }
    const errors = this.formatSaveWriteMutationPayloadErrors(missing, path);
    // TODO: emit relevant events
    return { save, errors };
  }
  /**
   * construct saves and errors types from the data services
   * @param missing missing savesId
   * @param updated updated saves
   * @param path mutation path
   * @returns SaveWriteMutationPayload saves updated and any errors that occurred
   * @private
   */
  private formatSaveWriteMutationPayloadErrors(
    missing: string[],
    path: GraphQLResolveInfo['path'],
  ): SaveWriteMutationPayload['errors'] {
    // prettier-ignore
    const errors =
      missing.length > 0
        ? missing.map((missingId) =>
          this.context.models.notFound.message('saveId', missingId)
        )
        : [];
    const resolvedErrors = errors.map((error) => ({
      ...error,
      path: this.context.models.notFound.path(path),
    }));
    return resolvedErrors;
  }

  private formatBatchUpdateInput(
    inputs: SaveUpdateTagsInputGraphql[],
  ): SaveUpdateTagsInputDb {
    // Explode input into itemId, tagName tuples for easier processing;
    // also sanitize create inputs.
    const updates: SaveUpdateTagsInputDb = inputs.reduce(
      (updates, input) => {
        const savedItemId = input.saveId;
        const addTag = input.addTagNames.map((name) => ({
          savedItemId: input.saveId,
          name: sanitizeTagName(name),
        }));
        const removeTag = input.removeTagIds.map((id) => ({
          savedItemId,
          name: TagModel.decodeId(id),
        }));
        updates.creates.push(...addTag);
        updates.deletes.push(...removeTag);
        return updates;
      },
      {
        deletes: new Array<TagSaveAssociation>(),
        creates: new Array<TagSaveAssociation>(),
      } as SaveUpdateTagsInputDb,
    );
    // Finally deduplicate inputs when done exploding
    updates.deletes = deduplicateTagInput(updates.deletes);
    updates.creates = deduplicateTagInput(updates.creates);
    return updates;
  }

  /**
   * Fetch list of item ids associated with a tag name.
   */
  private async getItemIdAssociations(tag: string): Promise<string[]> {
    return await this.tagService.fetchItemIdAssociations(tag);
  }

  public async tagsList(syncSince?: Date): Promise<string[] | undefined> {
    return await this.tagService.tagsList(syncSince);
  }
}

/**
 * Processes tag inputs prior to insertion/query in the database.
 * Performs the following:
 *  1. Convert to lowercase
 *  2. Trim whitespace
 *  3. Replace the unicode replacement character with ?, if present
 *  4. Truncate to 25 characters (an emoji counts as 1 character even if
 *     represented with multiple code points)
 *  5. Apply php addslashes function (ported to ts)
 *  6. Validates that the tag string is not empty, else throws an error
 *
 * TODO: Let's decide on some kind
 * of validation library or figure out how to enforce
 * input constraints on the GraphQL schema
 * @param tagName the raw tag string
 * @returns string: the cleaned tag
 * @throws Error if cleaning results in an empty string
 */

export function sanitizeTagName(name: string): string {
  const strippedTag = Array.from(
    name
      .replace(new RegExp('\uFFFD', 'g'), '?') // unicode replacement character
      .trim()
      .toLowerCase(),
  )
    .slice(0, 25)
    .join('');
  if (strippedTag.length === 0) {
    throw new UserInputError(
      'Tag name must have at least 1 non-whitespace character.',
    );
  }
  return addslashes(strippedTag);
}

/**
 * Validate that any query response that returns a Tag from
 * the database can be parsed correctly into the GraphQL entity (contains
 * the required fields).
 * This is more to ensure that the developer has returned all
 * required fields from queries, since the data model does not match
 * the graphql entity.
 */
const validateTag = (tag: any): true => {
  const tagModelFields: { field: string; required?: boolean }[] = [
    { field: 'name', required: true },
    { field: '_version', required: false },
    { field: '_deletedAt', required: false },
  ];

  let err: string;
  for (const property of tagModelFields) {
    if (!Object.prototype.hasOwnProperty.call(tag, property.field)) {
      err = `unable to find the property : ${property.field} from the database query}`;
    } else if (property.required && tag[property.field] == null) {
      err = `field : ${property.field} is null in object ${JSON.stringify(
        tag,
      )}`;
    }
  }

  if (err) {
    Sentry.captureException(err);
    throw new Error(err);
  }
  return true;
};

/**
 * Deduplicate a batch of tags prior to inserting in the
 * database. Compares values for all keys of the TagSaveAssociation type.
 * The keys aren't available until compile time, but if they get changed
 * the linter should remind the dev to update.
 * Best if this method is run after tags are 'cleaned'.
 */
export function deduplicateTagInput(
  tagInputs: TagSaveAssociation[],
): TagSaveAssociation[] {
  const deduplicated = new Map();
  const tagKeys: Array<keyof TagSaveAssociation> = ['name', 'savedItemId'];
  tagInputs.forEach((tagInput: TagSaveAssociation) => {
    // Combine all values of all tag input props into a single lookup key
    const lookupKey = tagKeys.reduce(
      (accumulator: string, currentKey) =>
        accumulator + `|${tagInput[currentKey]}`,
      '',
    );
    deduplicated.set(lookupKey, tagInput);
  });
  return Array.from(deduplicated.values());
}

/**
 * Deduplicate and and sanitize tag create inputs.
 * Convenience function.
 * TODO: Input constraints on schema?
 */
const sanitizeTagSaveAssociation = (
  tagInputs: TagSaveAssociation[],
): TagSaveAssociation[] => {
  const input = deduplicateTagInput(tagInputs).map(({ name, savedItemId }) => {
    return {
      name: sanitizeTagName(name),
      savedItemId,
    };
  });
  if (input.length === 0) {
    throw new UserInputError('Must provide 1 or more values for tag mutations');
  }
  return input;
};
