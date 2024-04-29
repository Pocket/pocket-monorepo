import {
  Item,
  ItemSummary,
  ItemSummarySource,
} from '../__generated__/resolvers-types';
import config from '../config';
import { DateTime } from 'luxon';
import { IContext } from '../apollo/context';
import {
  IItemSummaryDataStore,
  ItemSummaryEntity,
} from '../databases/itemSummaryStore';
import md5 from 'md5';

export interface IItemSummaryDataSource {
  matcher: RegExp;
  ttl: number; // The ttl of the data in seconds
  source: ItemSummarySource;
  deriveItemSummary(
    item: Item,
    fallbackItemSummary: ItemSummary,
    context: IContext,
  ): Promise<ItemSummary>;
  isEnabled(context: IContext): boolean;
}

export class ItemSummaryModel {
  constructor(
    private readonly db: IItemSummaryDataStore,
    private readonly datasources: IItemSummaryDataSource[],
  ) {}

  public async deriveItemSummary(
    item: Item,
    context: IContext,
  ): Promise<ItemSummary> {
    const url = item.givenUrl; // the url we are going to key everything on.
    const fallbackParserItemSummary = {
      id: item.id,
      image: item.topImage ?? item.images?.[0],
      excerpt: item.excerpt,
      title: item.title ?? item.givenUrl,
      authors: item.authors,
      domain: item.domainMetadata,
      datePublished: item.datePublished
        ? DateTime.fromSQL(item.datePublished, {
            zone: config.mysql.tz,
          }).toJSDate()
        : null,
      url: url,
      source: ItemSummarySource.PocketParser,
      item,
    };

    // First we filter to our sources.
    // We do this first because some sources could be behind a feature flag or not enabled
    // We also only store other data sources beyond our parser in the datastore, \
    // since the parser is cached elsewhere in Pocket
    const sources = this.datasources.filter((datasource) => {
      const pass =
        datasource.isEnabled(context) && datasource.matcher.test(url);
      return pass;
    });
    if (sources.length == 0) return fallbackParserItemSummary;

    const source = sources[0];

    const storedSummary = await this.getItemSummary(url);
    // we need to ensure the stored source we pulled out of the dynamodb matches the one we are looking
    // for in case 2 sites are used by multipe sources or an older less specific source
    // TODO: In the future we should probably do a more specific select of the dynamodb data
    if (storedSummary && source.source == storedSummary.source) {
      return { ...storedSummary, item };
    }

    const newSummary = await sources[0].deriveItemSummary(
      item,
      fallbackParserItemSummary,
      context,
    );
    if (newSummary == null) return fallbackParserItemSummary;

    // specifically we do not await this, so its a non-blocking call.
    this.saveItemSummary(newSummary, source.ttl);

    return { ...newSummary, item };
  }

  /**
   * Convert input to DynamoDB entity
   */
  toEntity(itemSummary: ItemSummary): ItemSummaryEntity {
    let date = itemSummary.datePublished;
    if (date instanceof Date) {
      date = Math.round(date.getTime() / 1000);
    }
    // We are explicit instead of using a spread so we don't save more data then we need.
    return {
      dataSource: itemSummary.source,
      authors: itemSummary.authors,
      datePublished: date, // time in s
      // Domain is a reserved keyword in dynamodb so we need to remap it.
      domainMetadata: itemSummary.domain,
      excerpt: itemSummary.excerpt,
      id: itemSummary.id,
      image: itemSummary.image,
      title: itemSummary.title,
      itemUrl: itemSummary.url,
      urlHash: md5(itemSummary.url),
      createdAt: Math.round(Date.now() / 1000),
    };
  }
  /**
   * Convert DynamoDB entity to GraphQL Type
   */
  fromEntity(entity: ItemSummaryEntity): ItemSummary {
    return {
      ...entity,
      __typename: 'ItemSummary' as const,
      domain: entity.domainMetadata,
      url: entity.itemUrl,
      source: entity.dataSource,
      datePublished: entity.datePublished
        ? DateTime.fromSeconds(entity.datePublished).toJSDate()
        : null,
    };
  }

  /**
   * Stores an item summary to the data store
   * @param itemSummary the data to store to the dynamodb datastore
   * @returns the data that was saved to the store
   * @throws internal server error if summary could not be created
   */
  async saveItemSummary(
    itemSummary: ItemSummary,
    ttl: number,
  ): Promise<ItemSummary> {
    const input = this.toEntity(itemSummary);
    const res = await this.db.storeItemSummary(input, ttl);
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
