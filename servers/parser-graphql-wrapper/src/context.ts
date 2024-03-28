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
    itemIdLoader: DataLoader<string[], Promise<Item[]>>;
    itemUrlLoader: DataLoader<string[], Promise<Item[]>>;
    shortUrlLoader: DataLoader<BatchAddShareUrlInput, string>;
  };
  repositories: {
    itemResolver: Promise<ItemResolverRepository>;
    sharedUrlsResolver: Promise<SharedUrlsResolverRepository>;
  };
}

/**
 * ContextManager currently has no parameters and is stateless,
 * it may be passed around directly as a single object.
 */
export class ContextManager implements IContext {
  public readonly dataLoaders: IContext['dataLoaders'];
  public readonly repositories: IContext['repositories'];

  constructor() {
    this.dataLoaders = {
      itemIdLoader: itemIdLoader,
      itemUrlLoader: itemUrlLoader,
      shortUrlLoader: ShortUrlLoader,
    };
    this.repositories = {
      itemResolver: getItemResolverRepository(),
      sharedUrlsResolver: getSharedUrlsResolverRepo(),
    };
  }
}
