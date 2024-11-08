import DataLoader from 'dataloader';
import { itemIdLoader, ItemLoaderType, ShortUrlLoader } from '../dataLoaders';
import {
  BatchAddShareUrlInput,
  conn as sharesConn,
} from '../databases/readitlaShares';
import { conn as readitlabConn } from '../databases/readitlab';
import { ParserAPI } from '../datasources/ParserAPI';
import { getRedisCache } from '../cache';
import { DB as ReaditlabDB } from '../__generated__/readitlab';
import { DB as SharesDB } from '../__generated__/readitlaShares';
import { Kysely } from 'kysely';
import { PocketMetadataModel } from '../models/PocketMetadataModel';
import { ItemSummaryDataStoreBase } from '../databases/pocketMetadataStore';
import { dynamoClient } from '../datasources/dynamoClient';
import { OpenGraphModel } from '../models/pocketMetadataModels/OpenGraphModel';
import { OEmbedModel } from '../models/pocketMetadataModels/OEmbedModel';
import { IncomingHttpHeaders } from 'http';
import {
  PocketContextManager,
  PocketContext,
} from '@pocket-tools/apollo-utils';

/**
 * Change this to `extends BaseContext` once LegacyDataSourcesPlugin
 * can be deprecated.
 */
export interface IContext extends PocketContext {
  dataLoaders: {
    itemIdLoader: DataLoader<string, ItemLoaderType>;
    shortUrlLoader: DataLoader<BatchAddShareUrlInput, string>;
  };
  databases: {
    readitlab: Kysely<ReaditlabDB>;
    shares: Kysely<SharesDB>;
  };
  dataSources: {
    parserAPI: ParserAPI;
    pocketMetadataModel: PocketMetadataModel;
  };
}

/**
 * Initialize a new ContextManager instance to create fresh
 * dataloaders on a per-request basis.
 * Connections to ItemResolverRepository and SharedUrlsResolverRepository
 * will be reused for subsequent initializations after the first.
 */
export class ContextManager extends PocketContextManager implements IContext {
  public readonly dataLoaders: IContext['dataLoaders'];
  public readonly dataSources: IContext['dataSources'];
  public readonly databases: IContext['databases'];

  private constructor(
    dataloaders: IContext['dataLoaders'],
    dataSources: IContext['dataSources'],
    databases: IContext['databases'],
    headers: IncomingHttpHeaders,
  ) {
    super(headers);
    this.dataLoaders = dataloaders;
    this.dataSources = dataSources;
    this.databases = databases;
  }
  static async initialize(config: {
    headers: { [key: string]: any };
  }): Promise<ContextManager> {
    const dataloaders = {
      itemIdLoader: itemIdLoader,
      shortUrlLoader: ShortUrlLoader(),
    };
    return new ContextManager(
      dataloaders,
      {
        parserAPI: new ParserAPI({ cache: getRedisCache() }),
        pocketMetadataModel: new PocketMetadataModel(
          new ItemSummaryDataStoreBase(dynamoClient()),
          // Add all datasource types here in order we should iterate them
          // Note that datasources should be indexed in this array from more specific to least specific
          // Note If you are adding a new type, make sure to return it in PocketMetadata __resolveTypename
          [new OEmbedModel(), new OpenGraphModel()],
        ),
      },
      {
        readitlab: readitlabConn(),
        shares: sharesConn(),
      },
      config.headers,
    );
  }
}
