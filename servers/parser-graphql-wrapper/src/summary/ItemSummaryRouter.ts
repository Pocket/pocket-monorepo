import {
  Item,
  ItemSummary,
  ItemSummarySource,
} from '../__generated__/resolvers-types';
import config from '../config';
import { DateTime } from 'luxon';
import { ItemSummaryModel } from '../models/ItemSummaryModel';
import { IContext } from '../apollo/context';

export interface IItemSummaryDataSource {
  deriveItemSummary(
    item: Item,
    fallbackItemSummary: ItemSummary,
    context: IContext,
  ): Promise<ItemSummary>;
  supportsItem(item: Item, context: IContext): Promise<boolean>;
  source(): ItemSummarySource;
}

export class ItemSummaryRouter {
  constructor(
    private readonly summaryModel: ItemSummaryModel,
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
    // We do this first because some sources could be behind a feature flag
    // We also only store other data sources beyond our parser in the datastore, \
    // since the parser is cached elsewhere in Pocket
    const sources = this.datasources.filter((datasource) => {
      return datasource.supportsItem(item, context);
    });
    if (sources.length == 0) return fallbackParserItemSummary;

    const storedSummary = await this.summaryModel.getItemSummary(url);
    if (storedSummary && sources[0].source() == storedSummary.source) {
      return storedSummary;
    }

    const newSummary = await sources[0].deriveItemSummary(
      item,
      fallbackParserItemSummary,
      context,
    );
    if (newSummary == null) return fallbackParserItemSummary;

    // specifically we do not await this, so its a non-blocking call.
    this.summaryModel.saveItemSummary(newSummary);

    return newSummary;
  }
}
