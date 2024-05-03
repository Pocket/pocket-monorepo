import {
  ClientError,
  Variables,
  RequestDocument,
  GraphQLClient,
  resolveRequestDocument,
} from 'graphql-request';
import {
  GraphQLRequestContext,
  GraphQLResponse,
  ResponseMiddleware,
  VariablesAndRequestHeadersArgs,
} from 'graphql-request/build/esm/types.js';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  SavedItemsSimpleQuery,
  SavedItemsSimpleQueryVariables,
  SavedItemsSimpleDocument,
  SavedItemsCompleteDocument,
  SavedItemsCompleteQuery,
  SavedItemsCompleteQueryVariables,
  AddSavedItemBeforeTagMutationVariables,
  AddSavedItemCompleteMutationVariables,
  AddSavedItemCompleteMutation,
  AddSavedItemCompleteDocument,
  AddSavedItemBeforeTagMutation,
  AddSavedItemBeforeTagDocument,
  AddTagsToSavedItemMutation,
  AddTagsToSavedItemMutationVariables,
  AddTagsToSavedItemDocument,
  SearchSavedItemsSimpleQueryVariables,
  SearchSavedItemsSimpleQuery,
  SearchSavedItemsCompleteQueryVariables,
  SearchSavedItemsCompleteQuery,
  SearchSavedItemsCompleteDocument,
  SearchSavedItemsSimpleDocument,
} from '../generated/graphql/index.js';
import config from '../config/index.js';
import * as Sentry from '@sentry/node';

export function getClient(
  accessToken: string,
  consumerKey: string,
  headers: any,
) {
  return new GraphQLClientFactory(
    accessToken,
    consumerKey,
    headers,
  ).createClient();
}

/**
 * Essentially a GraphQLClient Factory, which allows
 * for us to handle partial error/data responses with
 * middleware.
 * Instantiating this class sets up the basic configuration
 * for a GraphQL Client class (e.g. the endpoint url and the
 * headers we always include on the request).
 * Calling the `request` method creates an internal instance of
 * GraphQLClient, which is used to serve the request. The
 * internal GraphQLClient is injected with custom middleware
 * that allows us to handle error data specially; in this case, we
 * want to skip some known errors but still return data, and return
 * error if there is an unhandled issue.
 * The alternative of using `rawRequest` would require significant
 * refactoring due to the changes in response type, call signature, etc.
 * This allows us to essentially keep the same behavior of throwing
 * errors when we receive them, UNLESS it's an error we know we want
 * to skip (for example, requesting search history for a non-premium user).
 * If we want to skip other kinds of errors they just need to be included
 * in the middleware filter.
 */
export class GraphQLClientFactory {
  url: string;
  constructor(
    accessToken: string,
    consumerKey: string,
    private headers: any,
  ) {
    //these headers are not compatible with GraphQLClient's fetch.
    //they throw an error instead, so ignoring them
    // headers might include cookie, some observability traceIds, apollo studio headers
    // so, we are implicitly passing them and removing only those that causes issues
    delete headers['content-length'];
    delete headers['content-type'];
    delete headers['user-agent'];
    delete headers['host'];
    delete headers['accept-encoding'];
    delete headers['connection'];

    // add in that this is the proxy to the graphql call
    headers['apollographql-client-name'] = config.app.serviceName;

    //to allow both access token/consumer key based auth or cookie based auth
    if (accessToken && consumerKey) {
      this.url = `${config.graphQLProxy}?consumer_key=${consumerKey}&access_token=${accessToken}`;
    } else {
      this.url = `${config.graphQLProxy}?consumer_key=${consumerKey}`;
    }
  }
  public createClient(responseMiddleware?: ResponseMiddleware) {
    return new GraphQLClient(this.url, {
      headers: this.headers,
      fetch,
      responseMiddleware,
      errorPolicy: 'all',
    });
  }
  /**
   * Essentially a wrapper over `GraphQLClient.request`, but not all
   * overloads are implemented since we don't use them all.
   * Creates a new instance of GraphQLClient with custom middleware
   * to handle the request. The reason we need to wrap this function
   * is because the ResponseMiddleware type does not have access to
   * the request scope, which is necessary to properly build a ClientError
   * if the request should result in one.
   * This method uses a closure to inject the request context into the
   * middleware function so we can return well-formed errors when needed.
   */
  async request<T, V extends Variables = Variables>(
    document: RequestDocument | TypedDocumentNode<T, V>,
    ...variablesAndRequestHeaders: VariablesAndRequestHeadersArgs<V>
  ): Promise<T> {
    //
    const { query } = resolveRequestDocument(document);
    const [variables] = variablesAndRequestHeaders;
    const middleware = GraphQLClientFactory.createMiddlewareFn({
      query,
      variables,
    });
    const client = this.createClient(middleware);
    return client.request(document, ...variablesAndRequestHeaders);
  }
  /**
   * Create middleware function with access to the request context, so we
   * can return well-formed errors when needed.
   * Used to get around having to refactor to use rawRequest, but still
   * handle data + error responses.
   * This middleware explicitly skips the ForbiddenError returned when
   * recentSearches are requested for non-premium users. We still want
   * the response data in this case. Can add more error handling in
   * the future as needed.
   */
  static createMiddlewareFn(
    context: GraphQLRequestContext,
  ): ResponseMiddleware {
    const middleware: ResponseMiddleware = (response) => {
      if (!(response instanceof Error) && response.errors) {
        // Filter out the recent searches forbidden error
        // In the proxy this data is requested regardless of
        // premium status, so it's just skipped
        // If we want to add more matchers for skipping other
        // errors we can refactor this to become more modular
        const errors = response.errors.filter(
          (error) =>
            !(
              error.path.indexOf('recentSearches') &&
              error.extensions.code === 'FORBIDDEN'
            ),
        );
        // If there are still other kinds of errors, throw;
        // The rejected promise will be caught on the `catch`
        // callback of the middleware step, then the else-if statement
        // below will re-throw it for final handling
        if (errors.length) {
          const gqlResponse: GraphQLResponse = {
            data: response.data,
            errors: errors,
            extensions: response.extensions,
            status: response.status,
          };
          throw new ClientError(gqlResponse, context);
        }
        // There are unskipped errors; re-throw so that the request
        // evaluates to an error
      } else if (response instanceof Error) {
        throw response;
      }
    };
    return middleware;
  }
}

/**
 * function call to get saves (detailType=simple)
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param variables input variables required for the query
 */
export async function callSavedItemsByOffsetSimple(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SavedItemsSimpleQueryVariables,
): Promise<SavedItemsSimpleQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSavedItemsByOffsetSimple' });
  const client = new GraphQLClientFactory(accessToken, consumerKey, headers);
  return client.request<SavedItemsSimpleQuery, SavedItemsSimpleQueryVariables>(
    SavedItemsSimpleDocument,
    variables,
  );
}

/**
 * Call API to retrieve saves (detailType=complete)
 */
export async function callSavedItemsByOffsetComplete(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SavedItemsCompleteQueryVariables,
): Promise<SavedItemsCompleteQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSavedItemsByOffsetComplete' });
  const client = new GraphQLClientFactory(accessToken, consumerKey, headers);
  return client.request<
    SavedItemsCompleteQuery,
    SavedItemsCompleteQueryVariables
  >(SavedItemsCompleteDocument, variables);
}

/**
 * function call to search saves (detailType=simple), optionaly
 * including annotations (highlights) fields.
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param variables input variables required for the query
 * @param options additional options
 *    withAnnotations (default=false) - include annotations (highlights) fields
 */
export async function callSearchByOffsetSimple(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SearchSavedItemsSimpleQueryVariables,
): Promise<SearchSavedItemsSimpleQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSearchByOffsetSimple' });
  const client = new GraphQLClientFactory(accessToken, consumerKey, headers);
  return client.request<
    SearchSavedItemsSimpleQuery,
    SearchSavedItemsSimpleQueryVariables
  >(SearchSavedItemsSimpleDocument, variables);
}

/**
 * Call API to search saves (detailType=complete), optionally
 * including annotations (highlights) fields.
 */
export async function callSearchByOffsetComplete(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SearchSavedItemsCompleteQueryVariables,
): Promise<SearchSavedItemsCompleteQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSearchByOffsetComplete' });
  const client = new GraphQLClientFactory(accessToken, consumerKey, headers);
  return client.request<
    SearchSavedItemsCompleteQuery,
    SearchSavedItemsCompleteQueryVariables
  >(SearchSavedItemsCompleteDocument, variables);
}

/**
 * Add (upsert) a SavedItem. If tags are passed,
 * execute an additional mutation to associate them
 * to the SavedItem.
 *
 * This syntax is making my eyes bleed
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param variables variables required for the mutation
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param tags tags to associate to the saved item (optional)
 */
export async function addSavedItem(
  client: GraphQLClient,
  variables: AddSavedItemCompleteMutationVariables,
): Promise<AddSavedItemCompleteMutation>;
export async function addSavedItem(
  client: GraphQLClient,
  variables: AddSavedItemBeforeTagMutationVariables,
  tags: string[],
): Promise<AddTagsToSavedItemMutation>;
export async function addSavedItem(
  client: GraphQLClient,
  variables: // These are the same types...
  | AddSavedItemBeforeTagMutationVariables
    | AddSavedItemCompleteMutationVariables,
  tags?: string[],
): Promise<AddSavedItemCompleteMutation | AddTagsToSavedItemMutation> {
  Sentry.addBreadcrumb({ message: 'invoking addSavedItem' });
  // This one can use the base client since we don't have any errors we
  // know that we need to skip for the 'add' mutation
  if (tags) {
    const addResult = await client.request<
      AddSavedItemBeforeTagMutation,
      AddSavedItemBeforeTagMutationVariables
    >(AddSavedItemBeforeTagDocument, variables);
    const tagVariables = {
      tags: { savedItemId: addResult.upsertSavedItem.id, tags },
    };
    return await client.request<
      AddTagsToSavedItemMutation,
      AddTagsToSavedItemMutationVariables
    >(AddTagsToSavedItemDocument, tagVariables);
  } else {
    return await client.request<
      AddSavedItemCompleteMutation,
      AddSavedItemCompleteMutationVariables
    >(AddSavedItemCompleteDocument, variables);
  }
}
