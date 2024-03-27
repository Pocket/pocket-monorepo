import { ClientError, GraphQLClient } from 'graphql-request';
import { getClient } from '../graph/graphQLClient';
import {
  ItemAction,
  ItemAddAction,
  ItemTagAction,
  SendAction,
  TagDeleteAction,
  TagRenameAction,
} from './validations/SendActionValidators';
import { AddResponse, PendingAddResponse } from '../graph/types';
import { processV3Add } from './v3Add';
import * as Sentry from '@sentry/node';
import {
  AddTagsByIdDocument,
  AddTagsByIdMutation,
  AddTagsByIdMutationVariables,
  AddTagsByUrlDocument,
  AddTagsByUrlMutation,
  AddTagsByUrlMutationVariables,
  ArchiveSavedItemByIdDocument,
  ArchiveSavedItemByIdMutation,
  ArchiveSavedItemByIdMutationVariables,
  ArchiveSavedItemByUrlDocument,
  ArchiveSavedItemByUrlMutation,
  ArchiveSavedItemByUrlMutationVariables,
  ClearTagsDocument,
  ClearTagsMutation,
  ClearTagsMutationVariables,
  DeleteSavedItemByIdDocument,
  DeleteSavedItemByIdMutation,
  DeleteSavedItemByIdMutationVariables,
  DeleteSavedItemByUrlDocument,
  DeleteSavedItemByUrlMutation,
  DeleteSavedItemByUrlMutationVariables,
  DeleteTagDocument,
  DeleteTagMutation,
  DeleteTagMutationVariables,
  FavoriteSavedItemByIdDocument,
  FavoriteSavedItemByIdMutation,
  FavoriteSavedItemByIdMutationVariables,
  FavoriteSavedItemByUrlDocument,
  FavoriteSavedItemByUrlMutation,
  FavoriteSavedItemByUrlMutationVariables,
  RemoveTagsDocument,
  RemoveTagsMutation,
  RemoveTagsMutationVariables,
  RenameTagDocument,
  RenameTagMutation,
  RenameTagMutationVariables,
  ReplaceTagsDocument,
  ReplaceTagsMutation,
  ReplaceTagsMutationVariables,
  SavedItemUpsertInput,
  UnFavoriteSavedItemByIdDocument,
  UnFavoriteSavedItemByIdMutation,
  UnFavoriteSavedItemByIdMutationVariables,
  UnFavoriteSavedItemByUrlDocument,
  UnFavoriteSavedItemByUrlMutationVariables,
} from '../generated/graphql/types';
import { serverLogger } from '@pocket-tools/ts-logger';
import { customErrorHeaders } from '../middleware';
import { Request } from 'express';
import { epochSecondsToISOString } from '../graph/shared/utils';

type SendActionError = {
  message: string;
  type: string;
  code: string;
};

type SendActionResult = {
  status: 1;
  action_errors: Array<SendActionError | null>;
  action_results: Array<AddResponse | PendingAddResponse | boolean>;
};

export class ActionsRouter {
  private client: GraphQLClient;
  constructor(
    accessToken: string,
    consumerKey: string,
    headers: Request['headers'],
  ) {
    this.client = getClient(accessToken, consumerKey, headers);
  }
  public async processActions(
    actions: SendAction[],
  ): Promise<SendActionResult> {
    const result: SendActionResult = {
      status: 1,
      // Default values
      action_errors: Array(actions.length).fill(null),
      action_results: Array(actions.length).fill(false),
    };
    let i = 0;
    for await (const action of actions) {
      try {
        Sentry.addBreadcrumb({ data: action });
        // Note: casting `as any`
        // This seems to be a typescript bug, maybe with the length of the union...?
        // Typescript doesn't complain if you comment out any single transform field,
        // regardless of which one it is. But it won't work with all of them.
        const actionResult = await this[action.action](action as any);
        result['action_results'][i] = actionResult;
      } catch (err) {
        const defaultMessage = 'Something Went Wrong';
        if (err instanceof ClientError) {
          // Log bad inputs because that indicates a bug in the proxy code
          // Anything else should be captured by the router/subgraphs
          if (err.response.status === 400) {
            serverLogger.error(`/v3/send: ${err}`);
            Sentry.captureException(err);
          }
          const primaryError = err.response.errors[0];
          const primaryErrorData = customErrorHeaders(
            primaryError.extensions.code,
          );
          const errorResult = {
            message: primaryError.message ?? defaultMessage,
            type: primaryErrorData['X-Error'],
            code: primaryErrorData['X-Error-Code'],
          } as SendActionError;
          result['action_errors'][i] = errorResult;
        } else {
          // If an error occurs that doesn't originate from the client request,
          // populate a default error and log to Cloudwatch/Sentry
          const defaultError = customErrorHeaders('INTENAL_SERVER_ERROR');
          const errorResult = {
            message: defaultMessage,
            type: defaultError['X-Error'],
            code: defaultError['X-Error-Code'],
          } as SendActionError;
          result['action_errors'][i] = errorResult;
          serverLogger.error(`/v3/send: ${err}`);
          Sentry.captureException(err);
        }
      } finally {
        i += 1;
      }
    }
    return result;
  }
  /**
   * Process the 'add' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   * Public for unit-testing (consuming functions should use `processActions`).
   */
  public async add(
    input: ItemAddAction,
  ): Promise<AddResponse | PendingAddResponse> {
    const addVars: {
      input: SavedItemUpsertInput;
    } = {
      input: {
        url: input.url,
        timestamp: input.time,
        ...(input.title && { title: input.title }),
      },
    };
    return await processV3Add(this.client, addVars, input.tags);
  }
  /**
   * Process the 'readd' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   * Public for unit-testing (consuming functions should use `processActions`).
   */
  public async readd(
    input: Omit<ItemAction, 'action'> & { action: 'readd' },
  ): Promise<AddResponse | PendingAddResponse> {
    const addVars: {
      input: SavedItemUpsertInput;
    } = {
      input: {
        url: input.url,
        timestamp: input.time,
      },
    };
    return await processV3Add(this.client, addVars);
  }
  /**
   * Process the 'archive' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * Currently we only have a batch endpoint for ID-identified SavedItems;
   * splitting the execution and transforming the output based on which
   * identifier is used is annoying and a band-aid solution.
   * A more efficient path forward is to just continue using the single-item
   * endpoints, then move to using batch endpoints once the graph APIs
   * are available for both URL- and ID-identified saves.
   *
   * Technically, doing them one at a time like this is more similar
   * to the /v3 endpoint because unlike v3, the pocket-graph batch
   *  endpoints are atomic (either all operations fail or all operations succeed).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async archive(
    input: Omit<ItemAction, 'action'> & { action: 'archive' },
  ): Promise<true> {
    if (input.itemId) {
      const variables: ArchiveSavedItemByIdMutationVariables = {
        updateSavedItemArchiveId: input.itemId.toString(),
        timestamp: epochSecondsToISOString(input.time),
      };
      await this.client.request<
        ArchiveSavedItemByIdMutation,
        ArchiveSavedItemByIdMutationVariables
      >(ArchiveSavedItemByIdDocument, variables);
      // If we make it this far, the client did not throw
      // We don't actually need the result otherwise for
      // these /v3 operations
      return true;
    }
    const variables: ArchiveSavedItemByUrlMutationVariables = {
      givenUrl: input.url,
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<
      ArchiveSavedItemByUrlMutation,
      ArchiveSavedItemByUrlMutationVariables
    >(ArchiveSavedItemByUrlDocument, variables);
    // If we make it this far, the client did not throw
    // We don't actually need the result otherwise for
    // these /v3 operations
    return true;
  }
  /**
   * Process the 'favorite' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async favorite(
    input: Omit<ItemAction, 'action'> & { action: 'favorite' },
  ): Promise<true> {
    if (input.itemId) {
      const variables: FavoriteSavedItemByIdMutationVariables = {
        updateSavedItemFavoriteId: input.itemId.toString(),
        timestamp: epochSecondsToISOString(input.time),
      };
      await this.client.request<
        FavoriteSavedItemByIdMutation,
        FavoriteSavedItemByIdMutationVariables
      >(FavoriteSavedItemByIdDocument, variables);
      // If we make it this far, the client did not throw
      // We don't actually need the result otherwise for
      // these /v3 operations
      return true;
    }
    const variables: FavoriteSavedItemByUrlMutationVariables = {
      givenUrl: input.url,
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<
      FavoriteSavedItemByUrlMutation,
      ArchiveSavedItemByUrlMutationVariables
    >(FavoriteSavedItemByUrlDocument, variables);
    return true;
  }
  /**
   * Process the 'unfavorite' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async unfavorite(
    input: Omit<ItemAction, 'action'> & { action: 'unfavorite' },
  ): Promise<true> {
    if (input.itemId) {
      const variables: UnFavoriteSavedItemByIdMutationVariables = {
        updateSavedItemUnFavoriteId: input.itemId.toString(),
        timestamp: epochSecondsToISOString(input.time),
      };
      await this.client.request<
        UnFavoriteSavedItemByIdMutation,
        UnFavoriteSavedItemByIdMutationVariables
      >(UnFavoriteSavedItemByIdDocument, variables);
      // If we make it this far, the client did not throw
      // We don't actually need the result otherwise for
      // these /v3 operations
      return true;
    }
    const variables: UnFavoriteSavedItemByUrlMutationVariables = {
      givenUrl: input.url,
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<
      UnFavoriteSavedItemByIdMutation,
      UnFavoriteSavedItemByUrlMutationVariables
    >(UnFavoriteSavedItemByUrlDocument, variables);
    return true;
  }
  /**
   * Process the 'unfavorite' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async delete(
    input: Omit<ItemAction, 'action'> & { action: 'delete' },
  ): Promise<true> {
    if (input.itemId) {
      const variables: DeleteSavedItemByIdMutationVariables = {
        id: input.itemId.toString(),
        timestamp: epochSecondsToISOString(input.time),
      };
      await this.client.request<
        DeleteSavedItemByIdMutation,
        DeleteSavedItemByIdMutationVariables
      >(DeleteSavedItemByIdDocument, variables);
      // If we make it this far, the client did not throw
      // We don't actually need the result otherwise for
      // these /v3 operations
      return true;
    }
    const variables: DeleteSavedItemByUrlMutationVariables = {
      givenUrl: input.url,
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<
      DeleteSavedItemByUrlMutation,
      DeleteSavedItemByUrlMutationVariables
    >(DeleteSavedItemByUrlDocument, variables);
    return true;
  }
  /**
   * Process the 'tags_add' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async tags_add(
    input: Omit<ItemTagAction, 'action'> & { action: 'tags_add' },
  ): Promise<true> {
    if (input.itemId) {
      const variables: AddTagsByIdMutationVariables = {
        input: [{ savedItemId: input.itemId.toString(), tags: input.tags }],
        timestamp: epochSecondsToISOString(input.time),
      };
      await this.client.request<
        AddTagsByIdMutation,
        AddTagsByIdMutationVariables
      >(AddTagsByIdDocument, variables);
      // If we make it this far, the client did not throw
      // We don't actually need the result otherwise for
      // these /v3 operations
      return true;
    }
    const variables: AddTagsByUrlMutationVariables = {
      input: { givenUrl: input.url, tagNames: input.tags },
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<
      AddTagsByUrlMutation,
      AddTagsByUrlMutationVariables
    >(AddTagsByUrlDocument, variables);
    return true;
  }
  /**
   * Process the 'tags_clear' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async tags_clear(
    input: Omit<ItemAction, 'action'> & { action: 'tags_clear' },
  ) {
    const variables: ClearTagsMutationVariables = {
      savedItem: {
        ...(input.itemId && { id: input.itemId.toString() }),
        ...(input.url && { url: input.url }),
      },
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<ClearTagsMutation, ClearTagsMutationVariables>(
      ClearTagsDocument,
      variables,
    );
    return true;
  }
  /**
   * Process the 'tags_remove' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async tags_remove(
    input: Omit<ItemTagAction, 'action'> & { action: 'tags_remove' },
  ) {
    const variables: RemoveTagsMutationVariables = {
      savedItem: {
        ...(input.itemId && { id: input.itemId.toString() }),
        ...(input.url && { url: input.url }),
      },
      timestamp: epochSecondsToISOString(input.time),
      tagNames: input.tags,
    };
    await this.client.request<RemoveTagsMutation, RemoveTagsMutationVariables>(
      RemoveTagsDocument,
      variables,
    );
    return true;
  }
  /**
   * Process the 'tags_replace' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async tags_replace(
    input: Omit<ItemTagAction, 'action'> & { action: 'tags_replace' },
  ) {
    const variables: ReplaceTagsMutationVariables = {
      savedItem: {
        ...(input.itemId && { id: input.itemId.toString() }),
        ...(input.url && { url: input.url }),
      },
      timestamp: epochSecondsToISOString(input.time),
      tagNames: input.tags,
    };
    await this.client.request<
      ReplaceTagsMutation,
      ReplaceTagsMutationVariables
    >(ReplaceTagsDocument, variables);
    return true;
  }
  /**
   * Process the 'tag_rename' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async tag_rename(input: TagRenameAction) {
    const variables: RenameTagMutationVariables = {
      oldName: input.oldTag,
      newName: input.newTag,
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<RenameTagMutation, RenameTagMutationVariables>(
      RenameTagDocument,
      variables,
    );
    return true;
  }
  /**
   * Process the 'tag_delete' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async tag_delete(input: TagDeleteAction) {
    const variables: DeleteTagMutationVariables = {
      tagName: input.tag,
      timestamp: epochSecondsToISOString(input.time),
    };
    await this.client.request<DeleteTagMutation, DeleteTagMutationVariables>(
      DeleteTagDocument,
      variables,
    );
    return true;
  }
}
