import { serverLogger } from '@pocket-tools/ts-logger';
import { postRetry } from '../postRetry.ts';
import * as Sentry from '@sentry/aws-serverless';
import { config } from '../config.ts';
import { extractCollectionSlug } from '../utils.ts';

/**
 * Fetch the Collection "external ID" representing the
 * Collection entity, from its duplicate as a Corpus Item.
 * @param url The URL of the Corpus Item (for a Collection)
 * @returns the corpus id of the original source article,
 * or undefined if it does not exist.
 */
export async function collectionIdFromCorpus(
  url: string,
): Promise<string | undefined> {
  const operation = 'CorpusCollectionIdBySlug';
  const slug = extractCollectionSlug(url);
  if (slug == null) {
    Sentry.addBreadcrumb({ data: { query: operation, url } });
    Sentry.captureException('Could not extract slug from collection url');
  }
  const body = JSON.stringify({
    query: `
      query ${operation}($slug: String!)
        {
          collectionBySlug(slug: $slug) {
            externalId
          }
        }`,
    operationName: operation,
    variables: { slug },
  });
  const endpoint = `${config.pocketGraphEndpoint}?consumer_key=${config.consumerKey}`;
  const res = await postRetry(endpoint, body, {
    'apollographql-client-name': config.applicationName,
  });
  const response = await res.json();
  const collectionId: string | undefined =
    response.data?.collectionBySlug?.externalId;
  // just assume that if the ID is null and we have any errors at all,
  // it's null due to error and not just not-extant
  if (collectionId == null && response.errors != null) {
    Sentry.addBreadcrumb({ data: { query: operation, slug } });
    Sentry.captureException(response.errors);
    serverLogger.error({
      message: 'Error fetching Collection ID for Corpus Collection object',
      errorData: {
        errors: response.errors,
        slug,
      },
    });
  }
  return collectionId;
}
