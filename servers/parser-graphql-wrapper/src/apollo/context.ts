import DataLoader from 'dataloader';
import {
  itemIdLoader,
  ItemLoaderType,
  ShortUrlLoader,
} from '../dataLoaders/index.js';
import {
  BatchAddShareUrlInput,
  conn as sharesConn,
} from '../databases/readitlaShares.js';
import { conn as readitlabConn } from '../databases/readitlab.js';
import { ParserAPI } from '../datasources/ParserAPI.js';
import { getRedisCache } from '../cache/index.js';
import { DB as ReaditlabDB } from '../__generated__/readitlab.js';
import { DB as SharesDB } from '../__generated__/readitlaShares.js';
import { Kysely } from 'kysely';
import { PocketMetadataModel } from '../models/PocketMetadataModel.js';
import { ItemSummaryDataStoreBase } from '../databases/pocketMetadataStore.js';
import { dynamoClient } from '../datasources/dynamoClient.js';
import { OpenGraphModel } from '../models/pocketMetadataModels/OpenGraphModel.js';
import { OEmbedModel } from '../models/pocketMetadataModels/OEmbedModel.js';
import { BaseContext } from '@pocket-tools/apollo-utils';

export interface IContext extends BaseContext {
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
