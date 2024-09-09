import { ParserDocumentFields, ParserResult } from './types';
import { config } from './config';
import fetchRetry from 'fetch-retry';
import * as Sentry from '@sentry/aws-serverless';
import { stripHtml } from 'string-strip-html';
import { serverLogger } from '@pocket-tools/ts-logger';

const newFetch = fetchRetry(fetch);

/**
 * Make a request to the parser service, and convert the response
 * into the fields expected by the search index mapping.
 * @param url the URL of the content
 * @returns fields which can be indexed in the language-specific corpus
 * indices
 */
export async function parserRequest(
  url: string,
): Promise<ParserResult | undefined> {
  const options = {
    refresh: '0',
    images: '0',
    videos: '0',
    createIfNone: '1',
    enableItemUrlFallback: '1',
    output: 'regular',
    serviceId: config.privilegedServiceId,
  };
  const queryParams = new URLSearchParams({
    ...options,
    url,
  });

  const response = await newFetch(
    `${config.parserEndpoint}?${queryParams.toString()}`,
    {
      signal: AbortSignal.timeout(config.parser.timeout * 1000),
      retryDelay: 2000,
      retryOn: async function (attempt, error, response) {
        if (attempt > 3) return false;
        // Could still be resolving
        if (error == null) {
          try {
            const res = await response.clone().json();
            if (res.resolved_id === '0' || res.resolved_id == null) {
              return true;
            }
          } catch {
            return true;
          }
        }
      },
    },
  );
  if (!response.ok) {
    const message = 'Request to parser not ok';
    const requestData = {
      url: config.parserEndpoint,
      query_string: queryParams.toString(),
      method: 'get',
      data: {
        status: response.status,
        statusText: response.statusText,
      },
    };
    Sentry.captureEvent({
      message,
      request: requestData,
    });
    serverLogger.error({
      message,
      errorData: requestData,
    });
    return undefined;
  }
  const parserResult = await response.json();
  if (!parserResult.item_id) {
    const requestData = {
      url: config.parserEndpoint,
      query_string: queryParams.toString(),
      method: 'get',
      data: {
        result: parserResult,
      },
    };
    const message = 'Request to parser returned null item_id';
    Sentry.captureEvent({
      message,
      request: requestData,
    });
    serverLogger.error({
      message,
      errorData: requestData,
    });
    return undefined;
  }
  return parserResult;
}

/**
 * Remove HTML tags and unnecessary HTML data from the parser response.
 * This is likely not perfectly extracting just the relevant text blobs,
 * but it is good enough for helping search relevance.
 * @param article article response from the parser
 * @returns text content with HTML removed, or undefined if invalid/empty
 * article was passed.
 */
export function cleanExtractedText(
  article: string | undefined,
): string | undefined {
  if (article == null || article == '') {
    return undefined;
  }
  // e.g. <!--IMG_1-->, <!--VIDEO_13-->
  const mediaCommentRegex = /<!--(?:IMG|VIDEO)_\d+-->/g;
  const noComments = article.replace(/\n/g, ' ').replace(mediaCommentRegex, '');
  // Process article: strip HTML and remove comments
  const stripped = stripHtml(noComments, {
    stripTogetherWithTheirContents: [
      'script',
      'style',
      'xml',
      'picture',
      'source',
    ],
  }).result;
  return stripped;
}

/**
 * Compute estimated time to consume a piece of content in minutes. For articles
 * this is computed from the word count and language (by the parser service);
 * for videos this is the length of the video.
 * @param result the parser response with relevant fields for computing
 * time to consume
 * @returns Estimated time to consume a piece of content in minutes,
 * or undefined if it could not be computed
 */
export function timeToConsume(
  result: Pick<ParserResult, 'videos' | 'time_to_read' | 'has_video'>,
): number | undefined {
  if (result.has_video === '2') {
    const lengthSeconds = result.videos?.[1]?.length;
    if (lengthSeconds == null) return undefined;
    return Math.round(parseInt(lengthSeconds) / 60);
  } else {
    return result.time_to_read ?? undefined;
  }
}

/**
 * Parse the parent (primarily) and child (secondary) content types.
 * For example, if the parser determines that a piece of content is
 * a text-based article, the parent type is 'article'. If that content
 * contains both videos and images, then the child types are ['video', 'image'].
 * @param result ParserResult with content classification fields
 * @returns an object containing the parent and child type descriptions
 */
export function contentType(
  result: Pick<
    ParserResult,
    'isArticle' | 'isIndex' | 'has_video' | 'has_image'
  >,
): { parent: string | undefined; children: string[] | undefined } {
  let parent: string;
  if (result.isIndex == 1) {
    parent = 'index';
  } else if (result.isArticle == 1) {
    parent = 'article';
    // '2' = is an image (exclusive with other 'is_' fields)
  } else if (result.has_image == '2') {
    parent = 'image';
    // '2' = is a video (exclusive with other 'is_' fields)
  } else if (result.has_video == '2') {
    parent = 'video';
  } else {
    parent = undefined;
  }
  const children = [];
  if (result.has_video == '1') {
    children.push('video');
  }
  if (result.has_image == '1') {
    children.push('image');
  }
  return { parent, children: children.length > 0 ? children : undefined };
}

/**
 * Convert a parser result to the fields expected in the search index mapping
 */
export function parserResultToDoc(result: ParserResult): ParserDocumentFields {
  const { parent, children } = contentType(result);
  return {
    pocket_parser_extracted_text: cleanExtractedText(result.article),
    pocket_item_id: result.item_id,
    pocket_resolved_id: result.resolved_id,
    pocket_normal_url: result.normal_url,
    pocket_parser_request_given_url: result.given_url,
    pocket_resolved_url: result.resolved_normal_url,
    est_time_to_consume_minutes: timeToConsume(result),
    content_type_children: children,
    content_type_parent: parent,
  };
}
