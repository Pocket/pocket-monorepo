import { ClientError, GraphQLClient } from 'graphql-request';
import { getClient } from '../graph/graphQLClient';
import {
  AddAnnotationAction,
  DeleteAnnotationAction,
  ItemAction,
  ItemAddAction,
  ItemTagAction,
  SaveSearchAction,
  SendAction,
  TagDeleteAction,
  TagRenameAction,
  UnimplementedAction,
} from './validations/SendActionValidators';
import { AddResponse, PendingAddResponse } from '../graph/types';
import { processV3Add } from './v3Add';
import * as Sentry from '@sentry/node';
import {
  AddAnnotationByItemIdDocument,
  AddAnnotationByItemIdMutation,
  AddAnnotationByItemIdMutationVariables,
  AddAnnotationByUrlDocument,
  AddAnnotationByUrlMutation,
  AddAnnotationByUrlMutationVariables,
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
  DeleteAnnotationDocument,
  DeleteAnnotationMutation,
  DeleteAnnotationMutationVariables,
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
  ReAddByIdDocument,
  ReAddByIdMutation,
  ReAddByIdMutationVariables,
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
  SaveSearchDocument,
  SaveSearchMutation,
  SaveSearchMutationVariables,
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
import { AddItemTransformer } from '../graph/add/toRest';
import { InvalidActionError } from '../errors/InvalidActionError';

type SendActionError = {
  message: string;
  type: string;
  code: number;
};

type SendActionResult = {
  status: 1;
  action_errors: Array<SendActionError | null>;
  action_results: Array<
    AddResponse['item'] | PendingAddResponse['item'] | boolean
  >;
};

export class ActionsRouter {
  protected client: GraphQLClient;
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
        const actionResult =
          this[action.action] !== undefined
            ? await this[action.action](action as any)
            : this.invalidAction(action);
        result['action_results'][i] = actionResult;
      } catch (err) {
        const defaultMessage = 'Something Went Wrong';
        if (err instanceof ClientError) {
          const data = {
            action,
            status: err.response.status,
            request: {
              query: err.request.query,
              variables: err.request.variables,
            },
            response: err.response.data,
          };
          serverLogger.debug(data);
          Sentry.addBreadcrumb({ data });
          const defaultError = customErrorHeaders('INTERNAL_SERVER_ERROR')!;
          // Log bad inputs because that indicates a bug in the proxy code
          // Anything else should be captured by the router/subgraphs
          if (err.response.status === 400) {
            serverLogger.error(`/v3/send: ${err}`);
            Sentry.captureException(err);
          }
          const primaryError = err.response.errors?.[0];
          const primaryErrorData = customErrorHeaders(
            primaryError?.extensions?.code,
          );
          const errorResult = {
            message: primaryError?.message ?? defaultMessage,
            type: primaryErrorData
              ? primaryErrorData['X-Error']
              : defaultError['X-Error'],
            code: primaryErrorData
              ? primaryErrorData['X-Error-Code']
              : defaultError['X-Error-Code'],
          } as SendActionError;
          result['action_errors'][i] = errorResult;
        } else if (err instanceof InvalidActionError) {
          const defaultError = customErrorHeaders('BAD_USER_INPUT')!;
          const errorResult = {
            message: err.message,
            type: defaultError['X-Error'],
            code: defaultError['X-Error-Code'],
          } as SendActionError;
          result['action_errors'][i] = errorResult;
        } else {
          // If an error occurs that doesn't originate from the client request,
          // populate a default error and log to Cloudwatch/Sentry
          const defaultError = customErrorHeaders('INTERNAL_SERVER_ERROR')!;
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
  ): Promise<AddResponse['item'] | PendingAddResponse['item']> {
    if (input.url != null) {
      const addVars: {
        input: SavedItemUpsertInput;
      } = {
        input: {
          url: input.url,
          timestamp: input.time,
          ...(input.title && { title: input.title }),
        },
      };
      const result = await processV3Add(this.client, addVars, input.tags);
      return result['item'];
    }
    this.invalidAction({ action: 'add (item_id only)' });
  }
  /**
   * Process the 'readd' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   * Public for unit-testing (consuming functions should use `processActions`).
   */
  public async readd(
    input: Omit<ItemAction, 'action'> & { action: 'readd' },
  ): Promise<AddResponse['item'] | PendingAddResponse['item']> {
    if (input.itemId != null) {
      const variables: ReAddByIdMutationVariables = {
        id: input.itemId.toString(),
        timestamp: epochSecondsToISOString(input.time),
      };
      const result = await this.client.request<
        ReAddByIdMutation,
        ReAddByIdMutationVariables
      >(ReAddByIdDocument, variables);
      // TODO: Technically this is nullable, but is it ever
      // in the case that the client does not throw an error?
      const added = AddItemTransformer(result['reAddById']!);
      return added['item'];
    } else {
      const addVars: {
        input: SavedItemUpsertInput;
      } = {
        input: {
          url: input.url!, // This value is validated to be non-null if itemId is null
          timestamp: input.time,
        },
      };
      const added = await processV3Add(this.client, addVars);
      return added['item'];
    }
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
  public async favorite(
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
  /**
   * Process the 'recent_search' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async recent_search(input: SaveSearchAction) {
    const variables: SaveSearchMutationVariables = {
      search: {
        term: input.term,
        timestamp: epochSecondsToISOString(input.time),
      },
    };
    await this.client.request<SaveSearchMutation, SaveSearchMutationVariables>(
      SaveSearchDocument,
      variables,
    );
    return true;
  }
  /**
   * Process the 'add_annotation' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async add_annotation(input: AddAnnotationAction) {
    if (input.itemId) {
      const variables: AddAnnotationByItemIdMutationVariables = {
        input: [{ itemId: input.itemId.toString(), ...input.annotation }],
      };
      await this.client.request<
        AddAnnotationByItemIdMutation,
        AddAnnotationByItemIdMutationVariables
      >(AddAnnotationByItemIdDocument, variables);
      // If we make it this far, the client did not throw
      // We don't actually need the result otherwise for
      // these /v3 operations
      return true;
    }
    const variables: AddAnnotationByUrlMutationVariables = {
      input: { url: input.url, ...input.annotation },
    };
    await this.client.request<
      AddAnnotationByUrlMutation,
      AddAnnotationByUrlMutationVariables
    >(AddAnnotationByUrlDocument, variables);
    return true;
  }
  /**
   * Process the 'delete_annotation' action from a batch of actions sent to /v3/send.
   * The actions should be validated and sanitized before this is invoked.
   *
   * See `ActionsRouter.archive` for more detailed docstring (same pattern).
   * @returns true (operation is successful unless error is thrown)
   * @throws ClientError if operation fails
   */
  private async delete_annotation(input: DeleteAnnotationAction) {
    const variables: DeleteAnnotationMutationVariables = {
      id: input.id,
    };
    await this.client.request<
      DeleteAnnotationMutation,
      DeleteAnnotationMutationVariables
    >(DeleteAnnotationDocument, variables);
    return true;
  }
  private invalidAction(input: UnimplementedAction) {
    throw new InvalidActionError(input.action);
  }
}
