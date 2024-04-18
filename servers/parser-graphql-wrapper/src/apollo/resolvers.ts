import * as Sentry from '@sentry/node';
import { clear } from '../dataLoaders';
import config from '../config';
import { MarticleElement, parseArticle } from '../marticle/marticleParser';
import { CacheScope } from '@apollo/cache-control-types';
import {
  extractCodeFromShortUrl,
  givenUrlFromShareCode,
} from '../shortUrl/shortUrl';
import { SSMLModel } from '../models/SSMLModel';
import { serverLogger } from '@pocket-tools/ts-logger';
import { fallbackPage } from '../readerView';
import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { deriveItemSummary, itemSummaryFromUrl } from '../preview';
import { URLResolver } from 'graphql-scalars';
import { Resolvers, Videoness } from '../__generated__/resolvers-types';
import { BoolStringParam, MediaTypeParam } from '../datasources/ParserAPI';

export const resolvers: Resolvers = {
  ...PocketDefaultScalars,
  URL: URLResolver,
  Item: {
    __resolveReference: async (item, { dataLoaders, dataSources }, info) => {
      // Setting the cache hint manually here because when the gateway(Client API) resolves an item using this
      // Parser service, it does not respect the cacheHints on the schema types.
      // NOTE: The cache hint value for resolving the reference should always be the same as the cache hint on the type
      if (config.app.environment !== 'development') {
        info.cacheControl.setCacheHint({
          maxAge: config.app.defaultMaxAge,
          scope: 'PUBLIC' as CacheScope,
        });
      }

      if ('givenUrl' in item) {
        try {
          return await dataSources.parserAPI.getItemData(item.givenUrl);
        } catch (error) {
          const errorMessage =
            '__resolveReference: Error getting item by givenUrl';
          const errorData = {
            itemId: item.givenUrl,
            info: info,
          };
          serverLogger.error(errorMessage, { error: error, data: errorData });
          Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
          Sentry.captureException(error);
          throw error;
        }
      } else if ('itemId' in item) {
        try {
          const itemLoaderType = await dataLoaders.itemIdLoader.load(
            item.itemId,
          );
          return await dataSources.parserAPI.getItemData(itemLoaderType.url);
        } catch (error) {
          const errorMessage =
            '__resolveReference: Error getting item by itemId';
          const errorData = {
            itemId: item.itemId,
            info: info,
          };
          serverLogger.error(errorMessage, { error: error, data: errorData });
          Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
          Sentry.captureException(error);
          throw error;
        }
      }
    },
    article: async (parent, args, { dataSources }, info) => {
      if (parent.article) {
        // Use the parent resolver for article content if available
        // (e.g. via refreshArticle mutation), otherwise load the article
        return parent.article;
      }
      const item = await dataSources.parserAPI.getItemData(parent.givenUrl, {
        videos: MediaTypeParam.DIV_TAG,
        images: MediaTypeParam.DIV_TAG,
      });

      return item.article || null;
    },
    marticle: async (parent, args, { dataSources }, info) => {
      // Note: When the Web & Android teams switch to MArticle, make all the parser article call use
      // MediaTypeParam.AS_COMMENTS and add back this optimization:
      //
      // Use the parent resolver for article content if available
      //       // (e.g. via refreshArticle mutation), otherwise load the article
      //       const article =
      //         parent.parsedArticle ??
      const article = await dataSources.parserAPI.getItemData(parent.givenUrl, {
        videos: MediaTypeParam.AS_COMMENTS,
        images: MediaTypeParam.AS_COMMENTS,
        article: BoolStringParam.TRUE,
      });
      // Only extract Marticle data from article string if Parser
      // extracted valid data (isArticle or isVideo is 1)
      return article.isArticle ||
        article.hasVideo == Videoness.IsVideo ||
        article.hasVideo == Videoness.HasVideos
        ? parseArticle(article)
        : ([] as MarticleElement[]);
    },
    ssml: async (parent, args, { dataSources }, info) => {
      if (!parent.article && parent.isArticle) {
        parent.article = (
          await dataSources.parserAPI.getItemData(parent.givenUrl, {
            videos: MediaTypeParam.DIV_TAG,
            images: MediaTypeParam.DIV_TAG,
          })
        ).article;
      }

      if (!parent.article) {
        return null;
      }
      return SSMLModel.generateSSML(parent);
    },
    shortUrl: async (parent, args, context) => {
      // If the givenUrl is already a short share url, or there is a
      // short url key on the parent from a previous step, return the
      // same value to avoid another db trip
      if (parent['shortUrl']) {
        return parent['shortUrl'];
      }
      if (extractCodeFromShortUrl(parent.givenUrl) != null) {
        return parent.givenUrl;
      }
      return context.dataLoaders.shortUrlLoader.load({
        itemId: parseInt(parent.itemId),
        resolvedId: parseInt(parent.resolvedId),
        givenUrl: parent.givenUrl,
      });
    },
    preview: async (parent, args, context) => {
      return deriveItemSummary(parent, context);
    },
  },
  MarticleComponent: {
    __resolveType(marticleComponent, context, info) {
      if (marticleComponent.__typename) {
        return marticleComponent.__typename;
      }
    },
  },
  ReaderFallback: {
    __resolveType(fallback) {
      if ('itemCard' in fallback && fallback.itemCard.url) {
        return 'ReaderInterstitial';
      } else if ('message' in fallback) {
        return 'ItemNotFound';
      } else {
        return null;
      }
    },
  },
  Query: {
    //deprecated
    getItemByUrl: async (_source, { url }, { repositories, dataSources }) => {
      // If it's a special short share URL, use alternative resolution path
      const shortCode = extractCodeFromShortUrl(url);
      if (shortCode != null) {
        const givenUrl = await givenUrlFromShareCode(
          shortCode,
          await repositories.sharedUrlsResolver,
        );
        const item = await dataSources.parserAPI.getItemData(givenUrl);
        item['shortUrl'] = url;
        return item;
      } else {
        // Regular URL resolution
        return dataSources.parserAPI.getItemData(url);
      }
    },
    itemByUrl: async (_source, { url }, { repositories, dataSources }) => {
      // If it's a special short share URL, use alternative resolution path
      const shortCode = extractCodeFromShortUrl(url);
      if (shortCode != null) {
        const givenUrl = await givenUrlFromShareCode(
          shortCode,
          await repositories.sharedUrlsResolver,
        );
        const item = await dataSources.parserAPI.getItemData(givenUrl);
        item['shortUrl'] = url;
        return item;
      } else {
        // Regular URL resolution
        return await dataSources.parserAPI.getItemData(url);
      }
    },
    readerSlug: async (_, { slug }: { slug: string }, context) => {
      const fallbackData = await fallbackPage(slug, context);
      return { slug, fallbackPage: fallbackData };
    },
  },
  CorpusItem: {
    shortUrl: async ({ url }, args, { dataSources, dataLoaders }) => {
      // Unlikely, but if the givenUrl is already a short share url
      // return the same value to avoid another db trip
      if (extractCodeFromShortUrl(url) != null) {
        return url;
      }
      const item = await dataSources.parserAPI.getItemData(url);
      return dataLoaders.shortUrlLoader.load({
        itemId: parseInt(item.itemId),
        resolvedId: parseInt(item.resolvedId),
        givenUrl: item.givenUrl,
      });
    },
    timeToRead: async ({ url }, args, { dataSources }) => {
      // timeToRead is not a guaranteed field on CorpusItem - we shouldn't
      // return underlying parser errors to clients if this call fails
      // (as some clients will fail outright if any graph errors are present)
      try {
        const item = await dataSources.parserAPI.getItemData(url);
        return item.timeToRead || null;
      } catch (e) {
        return null;
      }
    },
  },
  Collection: {
    shortUrl: async ({ slug }, args, { dataSources, dataLoaders }) => {
      const item = await dataSources.parserAPI.getItemData(
        `${config.shortUrl.collectionUrl}/${slug}`,
      );
      // Unlikely, but if the givenUrl is already a short share url
      // return the same value to avoid another db trip
      if (extractCodeFromShortUrl(item.givenUrl) != null) {
        return item.givenUrl;
      }
      return dataLoaders.shortUrlLoader.load({
        itemId: parseInt(item.itemId),
        resolvedId: parseInt(item.resolvedId),
        givenUrl: item.givenUrl,
      });
    },
  },
  PocketShare: {
    preview: async (parent: { targetUrl: string }, _, context) => {
      return await itemSummaryFromUrl(parent.targetUrl, context);
    },
  },
  Mutation: {
    refreshItemArticle: async (
      _source,
      { url }: { url: string },
      { dataSources },
      info,
    ) => {
      const item = await dataSources.parserAPI.getItemData(url, {
        refresh: BoolStringParam.TRUE,
      });
      // Clear our dataloader cache
      clear({
        itemId: item.itemId,
        givenUrl: item.givenUrl,
        resolvedUrl: item.resolvedUrl,
        resolvedItemId: item.resolvedId,
      });

      return item;
    },
  },
};
