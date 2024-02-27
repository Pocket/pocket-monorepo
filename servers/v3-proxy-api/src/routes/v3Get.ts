import { Request, Response, Router } from 'express';
import { setSaveInputsFromGetCall } from '../graph/toGraphQL';
import {
  callSavedItemsByOffsetSimple,
  callSavedItemsByOffsetComplete,
} from '../graph/graphQLClient';
import {
  savedItemsSimpleToRest,
  savedItemsCompleteToRest,
} from '../graph/toRest';
import { UserSavedItemsByOffsetArgs } from '../generated/graphql/types';
import * as Sentry from '@sentry/node';
import { ErrorCodes, getErrorHeaders } from './errorMapper';
import { serverLogger } from '@pocket-tools/ts-logger';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import { V3GetParams, V3GetSchema } from './validations';

const router: Router = Router();

/**
 * Shared controller logic for POST and GET for /v3/get endpoint
 * The Web repo supports both to this route, so we must be backwards compatible.
 * @param methodName Whether it's a POST or GET method -- just affects error
 * message prefix.
 */
const v3GetController =
  (methodName: 'GET' | 'POST') => async (req: Request, res: Response) => {
    const result = validationResult(req);
    const data = matchedData(req, { includeOptionals: true }) as V3GetParams;
    if (!result.isEmpty()) {
      return res.status(400).send({ errors: result.array() });
    }
    try {
      const variables = setSaveInputsFromGetCall(data);
      const headers = req.headers;
      const accessToken = (data.access_token as string) ?? null;
      const consumerKey = (data.consumer_key as string) ?? null;

      return res.json(
        await processV3call(
          accessToken,
          consumerKey,
          headers,
          variables,
          data.detailType,
        ),
      );
    } catch (err) {
      const errMessage = `${methodName}: v3/get: ${err}`;
      serverLogger.error(errMessage);
      Sentry.addBreadcrumb({ message: errMessage });
      Sentry.captureException(err);
      return res
        .status(500)
        .header(getErrorHeaders(ErrorCodes.INTERNAL_SERVER_ERROR))
        .send({ error: errMessage });
    }
  };

router.get('/', checkSchema(V3GetSchema, ['query']), v3GetController('GET'));
router.post('/', checkSchema(V3GetSchema, ['body']), v3GetController('POST'));

/**
 * function call to get saves from graphQL and convert it to v3 Get response
 * @param accessToken user access token
 * @param consumerKey user consumer key
 * @param variables input variables required for the graphql query
 * @param headers request headers. treated as blackbox pass through for proxy
 */
export async function processV3call(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: UserSavedItemsByOffsetArgs,
  type: 'simple' | 'complete',
) {
  // Documenting additional parameters which change the shape of the response,
  // that have not been used in the past year (not including in proxy):
  //   - includeOpenUrl
  //   - extended
  if (type === 'complete') {
    const response = await callSavedItemsByOffsetComplete(
      accessToken,
      consumerKey,
      headers,
      variables,
    );
    return savedItemsCompleteToRest(response);
  }
  const response = await callSavedItemsByOffsetSimple(
    accessToken,
    consumerKey,
    headers,
    variables,
  );
  return savedItemsSimpleToRest(response);
}

export default router;
