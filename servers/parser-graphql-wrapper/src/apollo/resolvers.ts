import config from '../config';
import { MarticleElement, parseArticle } from '../marticle/marticleParser';
import { CacheScope } from '@apollo/cache-control-types';
import {
  extractCodeFromShortUrl,
  givenUrlFromShareCode,
} from '../shortUrl/shortUrl';
import { SSMLModel } from '../models/SSMLModel';
import { fallbackPage } from '../readerView';
import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { deriveItemSummary } from '../preview';
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
        return dataSources.parserAPI.getItemData(item.givenUrl);
      } else if ('itemId' in item) {
        const itemLoaderType = await dataLoaders.itemIdLoader.load(item.itemId);
        if (!itemLoaderType.url) {
          throw new Error(`No url found for itemId: ${item.itemId}`);
        }
        return dataSources.parserAPI.getItemData(itemLoaderType.url);
      }
    },
    article: async (parent, args, { dataSources }, info) => {
      if (parent.article) {
        // Use the parent resolver for article content if available
        // (e.g. via refreshArticle mutation), otherwise load the article
        return parent.article;
      }
      // If the field was requested via refreshArticle we need to clear the cache before we request data
      const clearCache = info.operation.name.value == 'refreshArticle';
      const item = await dataSources.parserAPI.getItemData(
        parent.givenUrl,
        {
          videos: MediaTypeParam.DIV_TAG,
          images: MediaTypeParam.DIV_TAG,
          noArticle: BoolStringParam.FALSE,
        },
        clearCache,
      );

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
      // If the field was requested via refreshArticle we need to clear the cache before we request data
      const clearCache = info.operation.name.value == 'refreshArticle';
      const article = await dataSources.parserAPI.getItemData(
        parent.givenUrl,
        {
          videos: MediaTypeParam.AS_COMMENTS,
          images: MediaTypeParam.AS_COMMENTS,
          noArticle: BoolStringParam.FALSE,
        },
        clearCache,
      );
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
        // If the field was requested via refreshArticle we need to clear the cache before we request data
        const clearCache = info.operation.name.value == 'refreshArticle';
        parent.article = (
          await dataSources.parserAPI.getItemData(
            parent.givenUrl,
            {
              videos: MediaTypeParam.DIV_TAG,
              images: MediaTypeParam.DIV_TAG,
              noArticle: BoolStringParam.FALSE,
            },
            clearCache,
          )
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
  // PocketShare: {
  //   preview: async (parent: { targetUrl: string }, _, context) => {
  //     return await itemSummaryFromUrl(parent.targetUrl, context);
  //   },
  // },
  Mutation: {
    refreshItemArticle: async (
      _source,
      { url }: { url: string },
      { dataSources },
      info,
    ) => {
      const item = await dataSources.parserAPI.getItemData(
        url,
        {
          refresh: BoolStringParam.TRUE,
        },
        true,
      );

      return item;
    },
  },
};
