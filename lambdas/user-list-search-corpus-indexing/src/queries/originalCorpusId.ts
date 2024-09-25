import { serverLogger } from '@pocket-tools/ts-logger';
import { postRetry } from '../postRetry';
import * as Sentry from '@sentry/aws-serverless';
import { config } from '../config';

/**
 * Fetch the original corpus id for a syndicated article,
 * or undefined if it does not exist. The goal is to deduplicate
 * corpus search results (preferring syndicated articles where
 * they exist, since they are hosted on Pocket and are
 * possible ad and recommendation surfaces).
 * @param url a syndicated article
 * @returns the corpus id of the original source article,
 * or undefined if it does not exist.
 */
export async function originalCorpusId(
  url: string,
): Promise<string | undefined> {
  const body = JSON.stringify({
    query: `
      query SyndicatedCorpusItemId($url: String!)
        {
          itemByUrl(url: $url) {
            syndicatedArticle {
              originalItem {
                corpusItem {
                  id
                }
              }
            }
          }
        }`,
    operationName: 'SyndicatedCorpusItemId',
    variables: { url },
  });
  const endpoint = `${config.pocketGraphEndpoint}?consumer_key=${config.consumerKey}`;
  const res = await postRetry(endpoint, body, {
    'apollographql-client-name': config.applicationName,
  });
  const response = await res.json();
  const originalCorpusId: string | undefined =
    response.data?.itemByUrl?.syndicatedArticle?.originalItem?.corpusItem?.id;
  // just assume that if the ID is null and we have any errors at all,
  // it's null due to error and not just not-extant
  if (originalCorpusId == null && response.errors != null) {
    Sentry.addBreadcrumb({ data: { query: 'SyndicatedCorpusItemId', url } });
    Sentry.captureException(response.errors);
    serverLogger.error({
      message: 'Error fetching original corpusId for syndicated content',
      errorData: {
        errors: response.errors,
        url,
      },
    });
  }
  return originalCorpusId;
}
