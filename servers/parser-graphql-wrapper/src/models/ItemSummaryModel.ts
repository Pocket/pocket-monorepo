import {
  IItemSummaryDataStore,
  ItemSummaryEntity,
} from '../datasources/itemSummaryStore';
import { ItemSummary } from '../__generated__/resolvers-types';
import md5 from 'md5';

export class ItemSummaryModel {
  constructor(private db: IItemSummaryDataStore) {}
  /**
   * Convert input to DynamoDB entity
   */
  toEntity(itemSummary: ItemSummary): ItemSummaryEntity {
    return {
      ...itemSummary,
      urlHash: md5(itemSummary.url),
      createdAt: Math.round(Date.now() / 1000),
    };
  }
  /**
   * Convert DynamoDB entity to GraphQL Type
   */
  fromEntity(entity: ItemSummaryEntity): ItemSummary {
    return {
      __typename: 'ItemSummary' as const,
      ...entity,
    };
  }

  /**
   * Stores an item summary to the data store
   * @param itemSummary the data to store to the dynamodb datastore
   * @returns the data that was saved to the store
   * @throws internal server error if summary could not be created
   */
  async saveItemSummary(itemSummary: ItemSummary): Promise<ItemSummary> {
    const input = this.toEntity(itemSummary);
    const res = await this.db.storeItemSummary(input);
    if (res instanceof Error) {
      throw res;
    }
    return this.fromEntity(res);
  }

  /**
   * Gets an item summary from the datastore for a url
   * @param resolvedUrl the url to try and fetch from the datastore
   * @returns the data that was saved to the store or null
   * @throws internal server error if summary could not be fetched
   */
  async getItemSummary(resolvedUrl: string): Promise<ItemSummary | null> {
    const res = await this.db.getStoredItemSummary(resolvedUrl);
    if (res instanceof Error) {
      throw res;
    }

    return res == null ? null : this.fromEntity(res);
  }
}
