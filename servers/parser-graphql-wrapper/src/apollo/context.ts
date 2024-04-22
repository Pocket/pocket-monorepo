import DataLoader from 'dataloader';
import { itemIdLoader, ItemLoaderType, ShortUrlLoader } from '../dataLoaders';
import {
  BatchAddShareUrlInput,
  ItemResolverRepository,
  SharedUrlsResolverRepository,
  getItemResolverRepository,
  getSharedUrlsResolverRepo,
} from '../datasources/mysql';
import { ParserAPI } from '../datasources/ParserAPI';
import { getRedisCache } from '../cache';

/**
 * Change this to `extends BaseContext` once LegacyDataSourcesPlugin
 * can be deprecated.
 */
export interface IContext {
  dataLoaders: {
    itemIdLoader: DataLoader<string, ItemLoaderType>;
    shortUrlLoader: DataLoader<BatchAddShareUrlInput, string>;
  };
  repositories: {
    itemResolver: ItemResolverRepository;
    sharedUrlsResolver: SharedUrlsResolverRepository;
  };
  dataSources: {
    parserAPI: ParserAPI;
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
  public readonly repositories: IContext['repositories'];
  public readonly headers: IContext['headers'];

  private constructor(
    dataloaders: IContext['dataLoaders'],
    dataSources: IContext['dataSources'],
    repositories: IContext['repositories'],
    headers: { [key: string]: any },
  ) {
    this.dataLoaders = dataloaders;
    this.dataSources = dataSources;
    this.repositories = repositories;
    this.headers = headers;
  }
  static async initialize(config: {
    headers: { [key: string]: any };
  }): Promise<ContextManager> {
    const dataloaders = {
      itemIdLoader: itemIdLoader,
      shortUrlLoader: ShortUrlLoader(),
    };
    const itemResolver = await getItemResolverRepository();
    const sharedUrlsResolver = await getSharedUrlsResolverRepo();
    return new ContextManager(
      dataloaders,
      {
        parserAPI: new ParserAPI({ cache: getRedisCache() }),
      },
      {
        itemResolver,
        sharedUrlsResolver,
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
