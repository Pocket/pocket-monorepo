import {
  Item,
  PocketMetadataSource,
  PocketMetadata,
  ItemSummary,
  SyndicatedArticle,
  CorpusItem,
  Collection,
} from '../__generated__/resolvers-types';
import config from '../config';
import { DateTime } from 'luxon';
import { IContext } from '../apollo/context';
import {
  IPocketMetadataDataStore,
  PocketMetadataEntity,
} from '../databases/pocketMetadataStore';
import md5 from 'md5';
import { getOriginalUrlIfPocketImageCached } from '@pocket-tools/image-utils';
import markdownToTxt from 'markdown-to-txt';

export interface IPocketMetadataDataSource {
  matcher: RegExp;
  ttl: number; // The ttl of the data in seconds
  source: PocketMetadataSource;
  version: number; // the version of the source parser
  derivePocketMetadata(
    item: Item,
    fallbackParserPocketMetadata: PocketMetadata,
    context: IContext,
  ): Promise<PocketMetadata>;
  isEnabled(context: IContext): boolean;
}

export class PocketMetadataModel {
  constructor(
    private readonly db: IPocketMetadataDataStore,
    private readonly datasources: IPocketMetadataDataSource[],
  ) {}

  public async derivePocketMetadata(
    item: Item,
    context: IContext,
    refresh: boolean,
    extraData: {
      corpusItem?: CorpusItem;
      syndicatedArticle?: SyndicatedArticle;
      collection?: Collection;
    } = {},
  ): Promise<PocketMetadata> {
    const { syndicatedArticle, collection, corpusItem } = extraData;
    const url = item.givenUrl; // the url we are going to key everything on.
    const syndicatedArticlePocketMetadata = this.transformSyndicatedArticle(
      item,
      syndicatedArticle,
    );
    if (syndicatedArticlePocketMetadata) {
      return syndicatedArticlePocketMetadata;
    }

    const collectionPocketMetadata = this.transformCollection(item, collection);
    if (collectionPocketMetadata) {
      return collectionPocketMetadata;
    }

    const corpusItemMetadata = this.transformCorpusItem(item, corpusItem);
    if (corpusItemMetadata) {
      return corpusItemMetadata;
    }

    const fallbackParserPocketMetadata = this.transformParserFallback(item);
    // First we filter to our sources.
    // We do this first because some sources could be behind a feature flag or not enabled
    // We also only store other data sources beyond our parser in the datastore, \
    // since the parser is cached elsewhere in Pocket
    const sources = this.datasources.filter((datasource) => {
      const pass =
        datasource.isEnabled(context) && datasource.matcher.test(url);
      return pass;
    });
    if (sources.length === 0) return fallbackParserPocketMetadata;

    const source = sources[0];

    if (!refresh) {
      const storedSummary = await this.getPocketMetadata(
        url,
        source.version,
        source.source,
      );
      // we need to ensure the stored source we pulled out of the dynamodb matches the one we are looking
      // for in case 2 sites are used by multipe sources or an older less specific source
      // TODO: In the future we should probably do a more specific select of the dynamodb data
      if (storedSummary && source.source === storedSummary.source) {
        return { ...storedSummary, item };
      }
    }

    const newPocketMetadata = await sources[0].derivePocketMetadata(
      item,
      fallbackParserPocketMetadata,
      context,
    );
    if (newPocketMetadata == null) return fallbackParserPocketMetadata;

    await this.savePocketMetadata(
      newPocketMetadata,
      source.ttl,
      source.version,
    );

    return { ...newPocketMetadata, item };
  }

  /**
   * Convert input to DynamoDB entity
   */
  toEntity(
    pocketMetadata: PocketMetadata & { __typename?: string },
    version: number,
  ): PocketMetadataEntity {
    let date = pocketMetadata.datePublished;
    if (date instanceof Date) {
      date = Math.round(date.getTime() / 1000);
    }
    return {
      ...pocketMetadata,
      __typename: pocketMetadata.__typename ?? 'Unknown',
      version,
      // we manually set the date cause we cant store a js date in dynamodb
      datePublished: date, // time in ms
      urlHash: md5(pocketMetadata.url),
      createdAt: Math.round(Date.now() / 1000),
    };
  }
  /**
   * Convert DynamoDB entity to GraphQL Type
   */
  fromEntity(entity: PocketMetadataEntity): PocketMetadata {
    return {
      ...entity,
      datePublished: entity.datePublished
        ? DateTime.fromSeconds(entity.datePublished).toJSDate()
        : null,
    };
  }

  /**
   * Stores a pocket metadata to the data store
   * @param pocketMetadata the data to store to the dynamodb datastore
   * @returns the data that was saved to the store
   * @throws internal server error if summary could not be created
   */
  async savePocketMetadata(
    pocketMetadata: PocketMetadata,
    ttl: number,
    version: number,
  ): Promise<PocketMetadata> {
    const input = this.toEntity(pocketMetadata, version);
    const res = await this.db.storePocketMetadata(input, ttl);
    if (res instanceof Error) {
      throw res;
    }
    return this.fromEntity(res);
  }

  /**
   * Gets a pocket metadata from the datastore for a url
   * @param resolvedUrl the url to try and fetch from the datastore
   * @returns the data that was saved to the store or null
   * @throws internal server error if summary could not be fetched
   */
  async getPocketMetadata(
    resolvedUrl: string,
    version: number,
    source: PocketMetadataSource,
  ): Promise<PocketMetadata | null> {
    const res = await this.db.getStoredPocketMetadata(
      resolvedUrl,
      version,
      source,
    );
    if (res instanceof Error) {
      throw res;
    }

    return res == null ? null : this.fromEntity(res);
  }

  /**
   *
   * @param item Item object from the Graph
   * @param collection Collection object from the graph
   * @returns ItemSummary data to be shown to the user
   */
  transformCollection(
    item: Item,
    collection: Collection,
  ): ItemSummary | undefined {
    if (!collection) {
      return;
    }
    const imageUrl = collection.imageUrl
      ? getOriginalUrlIfPocketImageCached(collection.imageUrl)
      : null;
    return {
      id: item.id,
      image: imageUrl ? { url: imageUrl, imageId: 0, src: imageUrl } : null,
      excerpt: markdownToTxt(collection.excerpt),
      title: collection.title,
      authors: collection.authors.map((author, index) => {
        return {
          name: author.name,
          id: index.toFixed(),
        };
      }),
      domain: {
        logo: 'https://getpocket.com/favicon.ico',
        name: 'Pocket',
      },
      datePublished: collection.publishedAt
        ? DateTime.fromISO(collection.publishedAt).toJSDate()
        : item.datePublished
          ? DateTime.fromSQL(item.datePublished, {
              zone: config.mysql.tz,
            }).toJSDate()
          : null,
      url: item.givenUrl,
      source: PocketMetadataSource.Collection,
      __typename: 'ItemSummary',
    };
  }

  /**
   *
   * @param item Item object from the Graph
   * @param syndicatedArticle Syndication object from the graph
   * @returns ItemSummary data to be shown to the user
   */
  transformSyndicatedArticle(
    item: Item,
    syndicatedArticle?: SyndicatedArticle,
  ): ItemSummary | undefined {
    if (!syndicatedArticle) {
      return;
    }
    const imageUrl = syndicatedArticle.mainImage
      ? getOriginalUrlIfPocketImageCached(syndicatedArticle.mainImage)
      : null;

    return {
      id: item.id,
      image: imageUrl ? { url: imageUrl, imageId: 0, src: imageUrl } : null,
      excerpt: syndicatedArticle.excerpt,
      title: syndicatedArticle.title,
      authors: syndicatedArticle.authorNames.map((author, index) => {
        return {
          name: author,
          id: index.toFixed(),
        };
      }),
      domain: {
        logo: syndicatedArticle.publisher?.logo,
        name: syndicatedArticle.publisher?.name,
      },
      datePublished: syndicatedArticle.publishedAt
        ? DateTime.fromISO(syndicatedArticle.publishedAt).toJSDate()
        : item.datePublished
          ? DateTime.fromSQL(item.datePublished, {
              zone: config.mysql.tz,
            }).toJSDate()
          : null,
      url: item.givenUrl,
      source: PocketMetadataSource.Syndication,
      __typename: 'ItemSummary',
    };
  }

  /**
   *
   * @param item Item object from the Graph
   * @param syndicatedArticle Syndication object from the graph
   * @returns ItemSummary data to be shown to the user
   */
  transformCorpusItem(
    item: Item,
    corpusItem?: CorpusItem,
  ): ItemSummary | undefined {
    if (!corpusItem) {
      return;
    }
    const imageUrl = getOriginalUrlIfPocketImageCached(corpusItem.image.url);

    return {
      id: corpusItem.id,
      image: {
        url: imageUrl,
        imageId: 0,
        src: imageUrl,
      },
      excerpt: corpusItem.excerpt,
      title: corpusItem.title,
      authors: corpusItem.authors
        .map((author) => {
          return {
            name: author.name,
            id: author.sortOrder.toFixed(),
          };
        })
        .sort((author1, author2) =>
          author1.id < author2.id ? -1 : author1.id > author2.id ? 1 : 0,
        ),
      domain: {
        name: corpusItem.publisher,
      },
      datePublished: corpusItem.datePublished
        ? DateTime.fromISO(corpusItem.datePublished).toJSDate()
        : item.datePublished
          ? DateTime.fromSQL(item.datePublished, {
              zone: config.mysql.tz,
            }).toJSDate()
          : null,
      url: item.givenUrl,
      source: PocketMetadataSource.CuratedCorpus,
      __typename: 'ItemSummary',
    };
  }

  /**
   * Transforms the item into ItemSummary
   * @param item The item that we need to transform
   * @returns
   */
  transformParserFallback(item: Item): ItemSummary | undefined {
    return {
      id: item.id,
      image: item.topImage ?? item.images?.[0],
      excerpt: item.excerpt,
      title: item.title && item.title !== '' ? item.title : item.givenUrl,
      authors: item.authors,
      domain: item.domainMetadata,
      datePublished: item.datePublished
        ? DateTime.fromSQL(item.datePublished, {
            zone: config.mysql.tz,
          }).toJSDate()
        : null,
      url: item.givenUrl,
      source: PocketMetadataSource.PocketParser,
      __typename: 'ItemSummary',
    };
  }
}
