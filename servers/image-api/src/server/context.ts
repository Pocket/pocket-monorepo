import { IncomingHttpHeaders } from 'http';
import { Image } from '../types/index.js';
import DataLoader from 'dataloader';
import { createImageDataLoaders } from '../dataLoaders/imageLoader.js';

export interface IContext {
  headers: IncomingHttpHeaders;
  dataLoaders: {
    imagesByUrl: DataLoader<string, Image>;
  };
}

export class ContextManager implements IContext {
  public readonly dataLoaders: IContext['dataLoaders'];

  constructor(
    private config: {
      request: any;
    },
  ) {
    this.dataLoaders = {
      ...createImageDataLoaders(this),
    };
  }

  get headers(): { [key: string]: any } {
    return this.config.request.headers;
  }
}
