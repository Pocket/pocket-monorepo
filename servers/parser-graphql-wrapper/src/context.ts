import DataLoader from 'dataloader';
import { ContextWithDataSources } from './datasources/legacyDataSourcesPlugin';
import { Item } from './model';
import { itemIdLoader, itemUrlLoader, ShortUrlLoader } from './dataLoaders';
import {
  BatchAddShareUrlInput,
  ItemResolverRepository,
  SharedUrlsResolverRepository,
  getItemResolverRepository,
  getSharedUrlsResolverRepo,
} from './database/mysql';

/**
 * Change this to `extends BaseContext` once LegacyDataSourcesPlugin
 * can be deprecated.
 */
export interface IContext extends ContextWithDataSources {
  dataLoaders: {
    itemIdLoader: DataLoader<string, Item>;
    itemUrlLoader: DataLoader<string, Item>;
    shortUrlLoader: DataLoader<BatchAddShareUrlInput, string>;
  };
  repositories: {
    itemResolver: ItemResolverRepository;
    sharedUrlsResolver: SharedUrlsResolverRepository;
  };
}

/**
 * Initialize a new ContextManager instance to create fresh
 * dataloaders on a per-request basis.
 * Connections to ItemResolverRepository and SharedUrlsResolverRepository
 * will be reused for subsequent initializations after the first.
 */
export class ContextManager implements IContext {
  public readonly dataLoaders: IContext['dataLoaders'];
  public readonly repositories: IContext['repositories'];

  private constructor(
    dataloaders: IContext['dataLoaders'],
    repositories: IContext['repositories'],
  ) {
    this.dataLoaders = dataloaders;
    this.repositories = repositories;
  }
  static async initialize(): Promise<ContextManager> {
    const dataloaders = {
      itemIdLoader: itemIdLoader,
      itemUrlLoader: itemUrlLoader,
      shortUrlLoader: ShortUrlLoader(),
    };
    const itemResolver = await getItemResolverRepository();
    const sharedUrlsResolver = await getSharedUrlsResolverRepo();
    return new ContextManager(dataloaders, {
      itemResolver,
      sharedUrlsResolver,
    });
  }
}
