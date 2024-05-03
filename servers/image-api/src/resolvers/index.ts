import { IContext } from '../server/context.js';
import { Image, CachedImageInput, CachedImage } from '../types/index.js';
import { getOriginalUrlIfPocketImageCached } from '../pocketImageCache/utils.js';
import { getPocketImageCachePath } from '../pocketImageCache/index.js';
import config from '../config/index.js';

export const resolvers = {
  Image: {
    __resolveReference: async ({ url }): Promise<Image> => {
      return {
        url: getOriginalUrlIfPocketImageCached(url),
        height: 0,
        width: 0,
      };
    },
    width: async (parent: Image, args, context: IContext): Promise<number> => {
      if (parent.width > 0) {
        return parent.width;
      }
      return (await context.dataLoaders.imagesByUrl.load(parent.url)).width;
    },
    height: async (parent: Image, args, context: IContext): Promise<number> => {
      if (parent.height > 0) {
        return parent.height;
      }
      return (await context.dataLoaders.imagesByUrl.load(parent.url)).height;
    },
    cachedImages: async (
      parent: Image,
      args: { imageOptions: CachedImageInput[] },
    ): Promise<CachedImage[]> => {
      return args.imageOptions.map((imageInput: CachedImageInput) => {
        //Generate our image cache url
        const imageCacheUrl = `${
          config.app.imageCacheEndpoint
        }/${getPocketImageCachePath(parent.url, imageInput)}`;

        return {
          id: imageInput.id,
          url: imageCacheUrl,
          height: 0,
          width: 0,
        };
      });
    },
  },
  CachedImage: {
    width: async (
      parent: CachedImage,
      args,
      context: IContext,
    ): Promise<number> => {
      if (parent.width > 0) {
        return parent.width;
      }
      return (await context.dataLoaders.imagesByUrl.load(parent.url)).width;
    },
    height: async (
      parent: CachedImage,
      args,
      context: IContext,
    ): Promise<number> => {
      if (parent.height > 0) {
        return parent.height;
      }
      return (await context.dataLoaders.imagesByUrl.load(parent.url)).height;
    },
  },
};
