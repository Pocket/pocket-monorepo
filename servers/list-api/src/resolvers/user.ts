import {
  Pagination,
  SavedItem,
  SavedItemConnection,
  SavedItemsFilter,
  SavedItemsSort,
  TagConnection,
  User,
  OffsetPaginationInput,
} from '../types';
import {
  SavedItemDataService,
  TagDataService,
  ListPaginationService,
} from '../dataService';
import { NotFoundError, validatePagination } from '@pocket-tools/apollo-utils';
import { IContext } from '../server/context';
import config from '../config';

/**
 * Get saved item by ID
 * @param parent
 * @param args
 * @param context
 */
export async function savedItemById(
  parent: User,
  args: { id: string },
  context: IContext,
): Promise<SavedItem> {
  const savedItem = await new SavedItemDataService(context).getSavedItemById(
    args.id,
  );
  if (savedItem == null) {
    throw new NotFoundError('Saved item not found');
  }
  return savedItem;
}

/**
 * Get paginated saved items
 * @param parent
 * @param args
 * @param context
 */
export function savedItems(
  parent: User,
  args: {
    filter: SavedItemsFilter;
    sort: SavedItemsSort;
    pagination: Pagination;
  },
  context: IContext,
): Promise<SavedItemConnection> {
  args.pagination = validatePagination(
    args.pagination,
    config.pagination.defaultPageSize,
    config.pagination.maxPageSize,
  );
  return new ListPaginationService(context).getSavedItems(
    args.filter,
    args.sort,
    args.pagination,
  );
}

/**
 * Get a page of SavedItems with offset-pagination.
 * Internal backend use only.
 */
export function savedItemsPage(
  parent: User,
  args: {
    filter: SavedItemsFilter | null;
    sort: SavedItemsSort | null;
    pagination: OffsetPaginationInput;
  },
  context: IContext,
) {
  return new ListPaginationService(context).getSavedItemsPage(
    args.filter,
    args.sort,
    args.pagination,
  );
}

/**
 * Get user tags
 * @param parent
 * @param args
 * @param context
 */
export async function tags(
  parent: User,
  args: {
    pagination: Pagination;
  },
  context: IContext,
): Promise<TagConnection> {
  args.pagination = validatePagination(
    args.pagination,
    config.pagination.defaultPageSize,
    config.pagination.maxPageSize,
  );
  return await new TagDataService(
    context,
    new SavedItemDataService(context),
  ).getTagsByUser(parent.id, args.pagination);
}
