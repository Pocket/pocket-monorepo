import * as Sentry from '@sentry/node';
import { clear, getItemById, getItemByUrl } from '../dataLoaders';
import config from '../config';
import {
  MediaTypeParam,
  ParserAPI,
  ParserArticle,
} from '../datasources/parserApi';
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
import { Resolvers } from '../__generated__/resolvers-types';

export const resolvers: Resolvers = {
  ...PocketDefaultScalars,
  URL: URLResolver,
  Item: {
    __resolveReference: async (item, { dataLoaders }, info) => {
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
          return await dataLoaders.itemUrlLoader.load(item.givenUrl);
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
          return await dataLoaders.itemIdLoader.load(item.itemId);
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
      const articleText = await (
        dataSources.parserAPI as ParserAPI
      ).articleLoader.load({
        url: parent.givenUrl,
        options: {
          imageStyle: MediaTypeParam.DIV_TAG,
          videoStyle: MediaTypeParam.DIV_TAG,
          maxAge: info.cacheControl.cacheHint.maxAge,
        },
      });
      return articleText.article;
    },
    marticle: async (parent, args, { dataSources }, info) => {
      // Note: When the Web & Android teams switch to MArticle, make all the parser article call use
      // MediaTypeParam.AS_COMMENTS and add back this optimization:
      //
      // Use the parent resolver for article content if available
      //       // (e.g. via refreshArticle mutation), otherwise load the article
      //       const article =
      //         parent.parsedArticle ??
      const article = await (
        dataSources.parserAPI as ParserAPI
      ).articleLoader.load({
        url: parent.givenUrl,
        options: {
          imageStyle: MediaTypeParam.AS_COMMENTS,
          maxAge: info.cacheControl.cacheHint.maxAge,
        },
      });
      // Only extract Marticle data from article string if Parser
      // extracted valid data (isArticle or isVideo is 1)
      return article.isArticle || article.isVideo
        ? parseArticle(article)
        : ([] as MarticleElement[]);
    },
    ssml: async (parent, args, { dataSources }, info) => {
      if (!parent.article && parent.isArticle) {
        parent.article = (
          (await (dataSources.parserAPI as ParserAPI).articleLoader.load({
            url: parent.givenUrl,
            options: {
              imageStyle: MediaTypeParam.DIV_TAG,
              videoStyle: MediaTypeParam.DIV_TAG,
              maxAge: info.cacheControl.cacheHint.maxAge,
            },
          })) as ParserArticle
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
    getItemByUrl: async (_source, { url }, { repositories }) => {
      // If it's a special short share URL, use alternative resolution path
      const shortCode = extractCodeFromShortUrl(url);
      if (shortCode != null) {
        const givenUrl = await givenUrlFromShareCode(
          shortCode,
          await repositories.sharedUrlsResolver,
        );
        const item = getItemByUrl(givenUrl);
        item['shortUrl'] = url;
        return item;
      } else {
        // Regular URL resolution
        return getItemByUrl(url);
      }
    },
    //deprecated
    getItemByItemId: async (_source, { id }, { repositories }) => {
      return getItemById(id, await repositories.itemResolver);
    },
    itemByUrl: async (_source, { url }, { repositories }) => {
      // If it's a special short share URL, use alternative resolution path
      const shortCode = extractCodeFromShortUrl(url);
      if (shortCode != null) {
        const givenUrl = await givenUrlFromShareCode(
          shortCode,
          await repositories.sharedUrlsResolver,
        );
        const item = await getItemByUrl(givenUrl);
        item['shortUrl'] = url;
        return item;
      } else {
        // Regular URL resolution
        return getItemByUrl(url);
      }
    },
    itemByItemId: async (_source, { id }, { repositories }) => {
      return getItemById(id, await repositories.itemResolver);
    },
    readerSlug: async (_, { slug }: { slug: string }, context) => {
      const fallbackData = await fallbackPage(slug, context);
      return { slug, fallbackPage: fallbackData };
    },
  },
  CorpusItem: {
    shortUrl: async ({ url }, args, context) => {
      // Unlikely, but if the givenUrl is already a short share url
      // return the same value to avoid another db trip
      if (extractCodeFromShortUrl(url) != null) {
        return url;
      }
      const item = await getItemByUrl(url);
      return context.dataLoaders.shortUrlLoader.load({
        itemId: parseInt(item.itemId),
        resolvedId: parseInt(item.resolvedId),
        givenUrl: item.givenUrl,
      });
    },
    timeToRead: async ({ url }, args, context) => {
      // timeToRead is not a guaranteed field on CorpusItem - we shouldn't
      // return underlying parser errors to clients if this call fails
      // (as some clients will fail outright if any graph errors are present)
      try {
        return (await getItemByUrl(url)).timeToRead;
      } catch (e) {
        return null;
      }
    },
  },
  Collection: {
    shortUrl: async ({ slug }, args, context) => {
      const item = await getItemByUrl(
        `${config.shortUrl.collectionUrl}/${slug}`,
      );
      // Unlikely, but if the givenUrl is already a short share url
      // return the same value to avoid another db trip
      if (extractCodeFromShortUrl(item.givenUrl) != null) {
        return item.givenUrl;
      }
      return context.dataLoaders.shortUrlLoader.load({
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
      // Article loader will always return a cache miss for `refresh`=true
      // so no need to use it
      const articleData = await (
        dataSources.parserAPI as ParserAPI
      ).getArticleByUrl(url, {
        refresh: true,
        imageStyle: MediaTypeParam.DIV_TAG,
        videoStyle: MediaTypeParam.DIV_TAG,
        maxAge: info.cacheControl.cacheHint.maxAge,
      });
      const item = await getItemByUrl(url);

      // Clear our dataloader cache
      clear({
        itemId: item.itemId,
        givenUrl: item.givenUrl,
        resolvedUrl: item.resolvedUrl,
        resolvedItemId: item.resolvedId,
      });

      return {
        ...item,
        article: articleData.article,
        parsedArticle: articleData,
      };
    },
  },
};
