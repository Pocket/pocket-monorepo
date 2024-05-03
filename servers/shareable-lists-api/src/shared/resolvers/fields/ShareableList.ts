import {
  PaginationInput,
  validatePagination,
} from '@pocket-tools/apollo-utils';
import {
  ListItemResponse,
  ListResponse,
  ShareableListItem,
} from '../../../database/types.js';
import { ListItemModel } from '../../../models/ShareableListItem.js';
import { BaseContext, Connection } from '../../types.js';
import config from '../../../config/index.js';

export async function ListItemsResolver(
  parent: ListResponse & { listItems?: ShareableListItem[] },
  args,
  context: BaseContext,
): Promise<ListItemResponse[]> {
  if (parent.listItems != null) {
    return parent.listItems as any;
  }
  return await new ListItemModel(context).findAllByListId(parent.id);
}

export async function ListItemsConnectionResolver(
  parent: ListResponse,
  args: { pagination: PaginationInput },
  context: BaseContext,
): Promise<Connection<ListItemResponse>> {
  const pagination = validatePagination(
    args.pagination,
    config.pagination.defaultPageSize,
    config.pagination.maxPageSize,
    false,
  );
  return await new ListItemModel(context).pageByListId(parent.id, pagination);
}
