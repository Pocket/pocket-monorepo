import { GraphQLClient } from 'graphql-request';

import {
  GetSavedItemsByOffsetSimpleQuery,
  GetSavedItemsByOffsetSimpleQueryVariables,
  SaveArchiveDocument,
  SaveArchiveMutation,
  SaveFavoriteDocument,
  SaveFavoriteMutation,
  SaveFavoriteMutationVariables,
  SaveArchiveMutationVariables,
  GetSavedItemsByOffsetSimpleDocument,
  GetSavedItemsByOffsetCompleteDocument,
  GetSavedItemsByOffsetCompleteQuery,
  GetSavedItemsByOffsetCompleteQueryVariables,
  AddSavedItemBeforeTagMutationVariables,
  AddSavedItemCompleteMutationVariables,
  AddSavedItemCompleteMutation,
  AddSavedItemCompleteDocument,
  AddSavedItemBeforeTagMutation,
  AddSavedItemBeforeTagDocument,
  AddTagsToSavedItemMutation,
  AddTagsToSavedItemMutationVariables,
  AddTagsToSavedItemDocument,
  SearchSavedItemsByOffsetSimpleQueryVariables,
  SearchSavedItemsByOffsetSimpleQuery,
  SearchSavedItemsByOffsetSimpleDocument,
  SearchSavedItemsByOffsetCompleteQueryVariables,
  SearchSavedItemsByOffsetCompleteQuery,
  SearchSavedItemsByOffsetCompleteDocument,
} from '../generated/graphql/types';
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
 * Calls saveArchive mutation
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param variables variables required for the mutation
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 */
export async function callSaveArchive(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SaveArchiveMutationVariables,
): Promise<SaveArchiveMutation> {
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<SaveArchiveMutation, SaveArchiveMutationVariables>(
    SaveArchiveDocument,
    variables,
  );
}

/**
 * Calls saveFavorite mutation
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param variables variables required for the mutation
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 */
export async function callSaveFavorite(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SaveFavoriteMutationVariables,
): Promise<SaveFavoriteMutation> {
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<SaveFavoriteMutation, SaveFavoriteMutationVariables>(
    SaveFavoriteDocument,
    variables,
  );
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
  variables: GetSavedItemsByOffsetSimpleQueryVariables,
): Promise<GetSavedItemsByOffsetSimpleQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSavedItemsByOffsetSimple' });
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<
    GetSavedItemsByOffsetSimpleQuery,
    GetSavedItemsByOffsetSimpleQueryVariables
  >(GetSavedItemsByOffsetSimpleDocument, variables);
}

/**
 * Call API to retrieve saves (detailType=complete)
 */
export async function callSavedItemsByOffsetComplete(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: GetSavedItemsByOffsetCompleteQueryVariables,
): Promise<GetSavedItemsByOffsetCompleteQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSavedItemsByOffsetComplete' });
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<
    GetSavedItemsByOffsetCompleteQuery,
    GetSavedItemsByOffsetCompleteQueryVariables
  >(GetSavedItemsByOffsetCompleteDocument, variables);
}

/**
 * function call to search saves (detailType=simple)
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param variables input variables required for the query
 */
export async function callSearchByOffsetSimple(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SearchSavedItemsByOffsetSimpleQueryVariables,
): Promise<SearchSavedItemsByOffsetSimpleQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSearchByOffsetSimple' });
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<
    SearchSavedItemsByOffsetSimpleQuery,
    SearchSavedItemsByOffsetSimpleQueryVariables
  >(SearchSavedItemsByOffsetSimpleDocument, variables);
}

/**
 * Call API to search saves (detailType=complete)
 */
export async function callSearchByOffsetComplete(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SearchSavedItemsByOffsetCompleteQueryVariables,
): Promise<SearchSavedItemsByOffsetCompleteQuery> {
  Sentry.addBreadcrumb({ message: 'invoking callSearchByOffsetComplete' });
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<
    SearchSavedItemsByOffsetCompleteQuery,
    SearchSavedItemsByOffsetCompleteQueryVariables
  >(SearchSavedItemsByOffsetCompleteDocument, variables);
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
