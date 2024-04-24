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
import { ItemSummaryRouter } from '../summary/ItemSummaryRouter';
import { ItemSummaryModel } from '../models/ItemSummaryModel';
import { dynamoClient } from '../datasources/dynamoClient';
import { ItemSummaryDataStoreBase } from '../datasources/itemSummaryStore';
import { OpenGraphDataSource } from '../summary/OpenGraphDatasource';

/**
 * Change this to `extends BaseContext` once LegacyDataSourcesPlugin
 * can be deprecated.
 */
export interface IContext {
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
    itemSummaryRouter: ItemSummaryRouter;
  };
  headers: { [key: string]: any };
  userId: string | undefined;
  apiId: string;
  ip: string | undefined;
}

/**
 * Initialize a new ContextManager instance to create fresh
 * dataloaders on a per-request basis.
 * Connections to ItemResolverRepository and SharedUrlsResolverRepository
 * will be reused for subsequent initializations after the first.
 */
export class ContextManager implements IContext {
  public readonly dataLoaders: IContext['dataLoaders'];
  public readonly dataSources: IContext['dataSources'];
  public readonly databases: IContext['databases'];
  public readonly headers: IContext['headers'];

  private constructor(
    dataloaders: IContext['dataLoaders'],
    dataSources: IContext['dataSources'],
    databases: IContext['databases'],
    headers: { [key: string]: any },
  ) {
    this.dataLoaders = dataloaders;
    this.dataSources = dataSources;
    this.databases = databases;
    this.headers = headers;
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
        itemSummaryRouter: new ItemSummaryRouter(
          new ItemSummaryModel(new ItemSummaryDataStoreBase(dynamoClient())),
          [new OpenGraphDataSource()], // Add all datasource types here in order we should iterate them
        ),
      },
      {
        readitlab: readitlabConn(),
        shares: sharesConn(),
      },
      config.headers,
    );
  }

  get userId(): string | undefined {
    const userId = this.headers.userid;
    return userId instanceof Array ? userId[0] : userId;
  }

  get apiId(): string {
    const apiId = this.headers.apiid || '0';
    return apiId instanceof Array ? apiId[0] : apiId;
  }

  get ip(): string | undefined {
    return (
      (this.headers.gatewayipaddress as string) ||
      (this.headers['origin-client-ip'] as string) ||
      undefined
    );
  }
}
