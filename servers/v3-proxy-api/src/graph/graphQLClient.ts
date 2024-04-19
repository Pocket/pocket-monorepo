import { GraphQLClient } from 'graphql-request';

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
  SearchSavedItemsSimpleDocument,
  SearchSavedItemsCompleteQueryVariables,
  SearchSavedItemsCompleteQuery,
  SearchSavedItemsCompleteDocument,
} from '../generated/graphql';
import config from '../config';
import * as Sentry from '@sentry/node';
/**
 * gives a graphQLClient for pocket-graph url
 *
 * This client initializes a `graphql-request` client
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 */
export function getClient(
  accessToken: string,
  consumerKey: string,
  headers: any,
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

  let url: string;

  // add in that this is the proxy to the graphql call
  headers['apollographql-client-name'] = config.app.serviceName;

  //to allow both access token/consumer key based auth or cookie based auth
  if (accessToken && consumerKey) {
    url = `${config.graphQLProxy}?consumer_key=${consumerKey}&access_token=${accessToken}`;
  } else {
    url = `${config.graphQLProxy}?consumer_key=${consumerKey}`;
  }
  Sentry.addBreadcrumb({ message: `creating GraphQL client` });
  return new GraphQLClient(url, {
    headers: headers,
    //fetch implementation used by node version,
    //can give custom fetch package
    fetch,
  });
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
  const client = getClient(accessToken, consumerKey, headers);
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
  const client = getClient(accessToken, consumerKey, headers);
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
  const client = getClient(accessToken, consumerKey, headers);
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
  const client = getClient(accessToken, consumerKey, headers);
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
