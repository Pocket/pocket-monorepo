import { SelectQueryBuilder } from 'kysely';
import { DB } from '.kysely/client/types';
import { ListItemResponse, ListItemSelect } from '../database/types';
import { BaseContext, Connection } from '../shared/types';
import { OffsetPagination } from '../database/OffsetPagination';
import { ValidatedPagination } from '@pocket-tools/apollo-utils';

export class ListItemModel {
  constructor(private context: BaseContext) {}
  byListId(
    listId: number,
  ): SelectQueryBuilder<DB, 'ListItem', ListItemResponse> {
    const qb = this.context.conn
      .selectFrom('ListItem')
      .select(ListItemSelect)
      .orderBy('sortOrder', 'asc')
      .orderBy('createdAt', 'asc')
      // Temporary tiebreaker sort for deterministic response
      .orderBy('itemId', 'asc')
      .where('listId', '=', listId);
    return qb;
  }
  /**
   * Return a page of Items associated to a List
   * @param listId the ID of the List
   * @param pagination pagination arguments
   * @returns a connection object representing a page of results
   */
  async pageByListId(
    listId: number,
    pagination: ValidatedPagination,
  ): Promise<Connection<ListItemResponse>> {
    const query = this.byListId(listId);
    return await new OffsetPagination<'ListItem', ListItemResponse>().page(
      pagination,
      query,
    );
  }
  /**
   * Return all Items associated to a List
   * Provided for compatibility; clients should use paginated queries
   * @param listId the ID of the List
   * @returns all Items associated to a List
   */
  async findAllByListId(listId: number): Promise<ListItemResponse[]> {
    return await this.byListId(listId).execute();
  }
}
