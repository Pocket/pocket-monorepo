import { QuerySearchCorpusArgs } from '../__generated__/types';
import { config } from '../config';
import { corpusClient as client } from '../datasource/clients/openSearch';
import { CorpusDocumentProperties } from './types';
import { estypes } from '@elastic/elasticsearch';
import * as Sentry from '@sentry/node';
import { SimpleQueryStringBuilder } from './CorpusSearchQueryBuilder';

/**
 * Make a request to elasticsearch/opensearch client to serve
 * corpus search data.
 */
export async function keywordSearch(args: QuerySearchCorpusArgs) {
  const body = new SimpleQueryStringBuilder(args).toJSON();
  const index =
    config.aws.elasticsearch.corpus.index[args.filter.language.toLowerCase()];
  try {
    const res = await client.search<
      estypes.SearchResponse<CorpusDocumentProperties>
    >({
      index,
      body,
    });
    return res.body;
  } catch (error) {
    // Since the error data might be not encapsulated in the
    // message, add breadcrubms for easier tracking
    if (error.meta && error.meta.body) {
      Sentry.addBreadcrumb({
        data: { error: error.meta.body.error, methodName: 'keywordSearch' },
      });
      throw error;
    } else {
      Sentry.addBreadcrumb({
        data: {
          error: error.message,
          methodName: 'keywordSearch',
        },
      });
    }
  }
}
