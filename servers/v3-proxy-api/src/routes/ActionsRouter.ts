import { ClientError, GraphQLClient } from 'graphql-request';
import { getClient } from '../graph/graphQLClient';
import {
  ItemAction,
  ItemAddAction,
  SendAction,
} from './validations/SendActionValidators';
import { AddResponse, PendingAddResponse } from '../graph/types';
import { processV3Add } from './v3Add';
import * as Sentry from '@sentry/node';
import { SavedItemUpsertInput } from '../generated/graphql/types';
import { serverLogger } from '@pocket-tools/ts-logger';
import { customErrorHeaders } from '../middleware';
import { Request } from 'express';

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
    actions: SendAction[], // Right now this is the only kind of action supported
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
        const actionResult = await this[action.action](action);
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
        ...(input.time && { timestamp: input.time }),
        ...(input.title && { title: input.title }),
      },
    };
    return await processV3Add(this.client, addVars, input.tags);
  }
  public async readd(
    input: Omit<ItemAction, 'action'> & { action: 'readd' },
  ): Promise<AddResponse | PendingAddResponse> {
    const addVars: {
      input: SavedItemUpsertInput;
    } = {
      input: {
        url: input.url,
        ...(input.time && { timestamp: input.time }),
      },
    };
    return await processV3Add(this.client, addVars);
  }
}
