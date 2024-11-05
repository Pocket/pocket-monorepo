import {
  PocketEvent,
  PocketEventBridgeClient,
  PocketEventType,
  Scope,
  SearchEvent,
  SearchPocketEventType,
} from '@pocket-tools/event-bridge';
import {
  CorpusSearchConnection,
  CorpusSearchFilters,
  QuerySearchCorpusArgs,
} from '../__generated__/types';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';
import { config } from '../config';
import { IContext } from '../server/context';
import { eventBridgeClient } from './client';

// For now we're just sending events for CorpusSearchConnection
export class EventBus {
  constructor(private client?: PocketEventBridgeClient) {
    if (client == null) {
      this.client = eventBridgeClient();
    }
  }
  /**
   * Build the snowplow user context for the event
   */
  private buildUserData(
    context: IContext,
  ): SearchEvent['detail']['event']['user'] {
    const hasUserId = Number.isInteger(parseInt(context.userId));
    const hasGuid = Number.isInteger(
      parseInt(context.request.headers['guid'] as string),
    );
    return {
      user_id: hasUserId ? parseInt(context.userId) : undefined,
      guid: hasGuid
        ? parseInt(context.request.headers['guid'] as string)
        : undefined,
      hashed_user_id: hasUserId
        ? (context.request.headers['encodedid'] as string)
        : undefined,
      hashed_guid: hasGuid
        ? (context.request.headers['encodedguid'] as string)
        : undefined,
    };
  }
  /**
   * Build the snowplow API User context for the event
   */
  private buildApiData(
    context: IContext,
  ): SearchEvent['detail']['event']['apiUser'] {
    return {
      api_id: parseInt(context.request.headers['apiid'] as string),
      is_native: context.isNative,
      is_trusted:
        context.request.headers['applicationistrusted'] === 'true'
          ? true
          : false,
    };
  }
  /**
   * Build the event for a corpus search result, with User and APIUser contexts.
   */
  public buildCorpusSearchResultEvent(
    input: CorpusSearchConnection,
    context: IContext,
    args: QuerySearchCorpusArgs,
    eventType: SearchPocketEventType,
  ): SearchEvent | undefined {
    // Special logging to Sentry if we're fielding requests for invalid
    // languages (these shouldn't get this far)
    const corpus =
      config.aws.elasticsearch.corpus.index[args.filter.language.toLowerCase()];
    if (corpus == null) {
      Sentry.addBreadcrumb({ data: { language: args.filter.language } });
      const message = 'Attempted to log search for invalid language';
      Sentry.captureException(message);
      serverLogger.error({
        message,
        language: args.filter.language,
      });
    }
    // Don't send events for bad responses
    if (input.totalCount == null || input.edges == null || corpus == null) {
      return undefined;
    }
    return {
      'detail-type': eventType,
      source: 'search-api-events',
      detail: {
        event: {
          search: {
            returned_at: Math.round(new Date().getTime() / 1000),
            id: crypto.randomUUID(),
            result_count_total: input.totalCount,
            result_urls: input.edges.map((edge) => edge.node.url),
            search_type: corpus,
            search_query: {
              query: args.search.query,
              scope:
                (args.search.field?.toLowerCase() as Scope) ?? 'all_contentful',
              filter: Object.keys(args.filter)
                .filter((_: keyof CorpusSearchFilters) => _ !== 'language')
                .map((_) => _),
            },
          },
          user: this.buildUserData(context),
          apiUser: this.buildApiData(context),
        },
      },
    };
  }
  /**
   * Send event to event bridge.
   * Capture errors and report to Sentry/Cloudwatch.
   */
  private async send(payload: PocketEvent) {
    await this.client.sendPocketEvent(payload);
  }
  /**
   * Build an event with required context for corpus search results,
   * and submit to event bridge for downstream consumers.
   */
  async sendCorpusSearchResultEvent(
    input: CorpusSearchConnection,
    context: IContext,
    args: QuerySearchCorpusArgs,
  ): Promise<void> {
    const payload = this.buildCorpusSearchResultEvent(
      input,
      context,
      args,
      PocketEventType.SEARCH_RESPONSE_GENERATED,
    );
    if (payload != null) {
      await this.send(payload);
    }
  }
}
