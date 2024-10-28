import { NextFunction, Request, Response, Router } from 'express';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import {
  ActionSanitizer,
  V3SendParams,
  V3SendSchemaGet,
  V3SendSchemaPost,
} from './validations';
import { InputValidationError } from '../errors/InputValidationError';
import { asyncHandler } from '../middleware/asyncHandler';
import { ActionsRouter } from './ActionsRouter';

const router: Router = Router();

/**
 * Shared controller logic for POST and GET for /v3/get endpoint
 * The Web repo supports both to this route, so we must be backwards compatible.
 * @param methodName Whether it's a POST or GET method -- just affects error
 * message prefix.
 */
const v3SendController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validationResult(req);
  const data = matchedData(req, { includeOptionals: false }) as V3SendParams;
  if (!result.isEmpty()) {
    throw new InputValidationError(result.array({ onlyFirstError: true })[0]);
  }
  // Additional per-action validation, since validating heterogenous
  // arrays with non-intersecting types is hard
  const actions = data.actions.map((action) => ActionSanitizer(action));
  const response = await new ActionsRouter(
    data.access_token,
    data.consumer_key,
    req.headers,
  ).processActions(actions);
  return response;
};

router.get(
  '/',
  checkSchema(V3SendSchemaGet, ['query', 'body']),
  asyncHandler(async (req, res, next) => {
    const result = await v3SendController(req, res, next);
    res.json(result);
  }),
);
router.post(
  '/',
  checkSchema(V3SendSchemaPost, ['body', 'query']),
  asyncHandler(async (req, res, next) => {
    const result = await v3SendController(req, res, next);
    res.json(result);
  }),
);

export default router;
