import * as Sentry from '@sentry/node';
import { Item } from './model';
import { clear, getItemById, getItemByUrl } from './dataLoaders/itemLoader';
import config from './config';
import { MediaTypeParam, ParserAPI } from './datasources/parserApi';
import { MarticleElement, parseArticle } from './marticle/marticleParser';
import { CacheScope } from '@apollo/cache-control-types';
import {
  getShortUrl,
  extractCodeFromShortUrl,
  itemIdFromShareCode,
} from './shortUrl/shortUrl';
import { IContext } from './context';
import { generateSSML } from './ssml/ssml';
import { serverLogger } from '@pocket-tools/ts-logger';

export const resolvers = {
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

      const { itemId, givenUrl } = item;

      try {
        return await (itemId
          ? dataLoaders.itemIdLoader.load(itemId)
          : dataLoaders.itemUrlLoader.load(givenUrl));
      } catch (error) {
        const errorMessage = '__resolveReference: Error getting item';
        const errorData = {
          itemId: itemId,
          givenUrl: givenUrl,
          info: info,
        };
        serverLogger.error(errorMessage, { error: error, data: errorData });
        Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
        Sentry.captureException(error);
        throw error;
      }
    },
    article: async (parent, args, { dataSources }, info): Promise<string> => {
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
    marticle: async (
      parent,
      args,
      { dataSources },
      info,
    ): Promise<MarticleElement[]> => {
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
    ssml: async (parent, args, { dataSources }, info): Promise<string> => {
      const item = parent as Item;

      if (!item.article && item.isArticle) {
        item.article = (
          await (dataSources.parserAPI as ParserAPI).articleLoader.load({
            url: parent.givenUrl,
            options: {
              imageStyle: MediaTypeParam.DIV_TAG,
              videoStyle: MediaTypeParam.DIV_TAG,
              maxAge: info.cacheControl.cacheHint.maxAge,
            },
          })
        ).article;
      }

      if (!item.article) {
        return null;
      }
      return generateSSML(item);
    },
    shortUrl: async (parent, args, context: IContext): Promise<string> => {
      const repo = await context.repositories.sharedUrlsResolver;
      // If the givenUrl is already a short share url, return the same value
      // to avoid another db trip
      if (extractCodeFromShortUrl(parent.givenUrl) != null) {
        return parent.givenUrl;
      }
      return await getShortUrl(
        parent.itemId,
        parent.resolvedId,
        parent.givenUrl,
        repo,
      );
    },
  },
  MarticleComponent: {
    __resolveType(marticleComponent, context, info) {
      if (marticleComponent.__typeName) {
        return marticleComponent.__typeName;
      }
    },
  },
  Query: {
    //deprecated
    getItemByUrl: async (_source, { url }, { repositories }): Promise<Item> => {
      // If it's a special short share URL, use alternative resolution path
      const shortCode = extractCodeFromShortUrl(url);
      if (shortCode != null) {
        const itemId = await itemIdFromShareCode(
          shortCode,
          await repositories.sharedUrlsResolver,
        );
        return getItemById(itemId, await repositories.itemResolver);
      } else {
        // Regular URL resolution
        return getItemByUrl(url);
      }
    },
    //deprecated
    getItemByItemId: async (
      _source,
      { id },
      { repositories },
    ): Promise<Item> => {
      return getItemById(id, await repositories.itemResolver);
    },
    itemByUrl: async (_source, { url }, { repositories }): Promise<Item> => {
      // If it's a special short share URL, use alternative resolution path
      const shortCode = extractCodeFromShortUrl(url);
      if (shortCode != null) {
        const itemId = await itemIdFromShareCode(
          shortCode,
          await repositories.sharedUrlsResolver,
        );
        return getItemById(itemId, await repositories.itemResolver);
      } else {
        // Regular URL resolution
        return getItemByUrl(url);
      }
    },
    itemByItemId: async (_source, { id }, { repositories }): Promise<Item> => {
      return getItemById(id, await repositories.itemResolver);
    },
    //add a resolver for shortUrl
  },
  CorpusItem: {
    shortUrl: async ({ url }, args, context: IContext): Promise<string> => {
      const item: Item = await getItemByUrl(url);
      const repo = await context.repositories.sharedUrlsResolver;
      return await getShortUrl(
        parseInt(item.itemId),
        parseInt(item.resolvedId),
        item.givenUrl,
        repo,
      );
    },
    datePublished: async (
      { url },
      args,
      context: IContext,
    ): Promise<string | undefined | null> => {
      // datePublished is not a guaranteed field on CorpusItem - we shouldn't
      // return underlying parser errors to clients if this call fails
      // (as some clients will fail outright if any graph errors are present)
      try {
        return (await getItemByUrl(url)).datePublished;
      } catch (e) {
        return null;
      }
    },
    timeToRead: async (
      { url },
      args,
      context: IContext,
    ): Promise<number | undefined | null> => {
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
    shortUrl: async ({ slug }, args, context: IContext): Promise<string> => {
      const item: Item = await getItemByUrl(
        `${config.shortUrl.collectionUrl}/${slug}`,
      );
      const repo = await context.repositories.sharedUrlsResolver;
      return await getShortUrl(
        parseInt(item.itemId),
        parseInt(item.resolvedId),
        item.givenUrl,
        repo,
      );
    },
  },
  Mutation: {
    refreshItemArticle: async (
      _source,
      { url }: { url: string },
      { dataSources },
      info,
    ): Promise<Item> => {
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
