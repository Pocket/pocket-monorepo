import { Request, Response, NextFunction, Router } from 'express';
import { checkSchema, Schema, validationResult } from 'express-validator';
import { nanoid } from 'nanoid';
import * as Sentry from '@sentry/node';
import { deleteSearchIndexByUserId } from '../../saves/elasticsearch';

export const router: Router = Router();

const batchDeleteSchema: Schema = {
  traceId: {
    in: ['body'],
    optional: true,
    isString: true,
    notEmpty: true,
  },
  userId: {
    in: ['body'],
    errorMessage: 'Must provide valid userId',
    isInt: true,
    toInt: true,
  },
};

export function validate(
  req: Request,
  res: Response,
  next: NextFunction,
): Response {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() })
      .setHeader('Content-Type', 'application/json');
  }
  next();
}

router.post(
  '/',
  checkSchema(batchDeleteSchema),
  validate,
  (req: Request, res: Response) => {
    const requestId = req.body.traceId ?? nanoid();
    const userId = req.body.userId;

    deleteSearchIndexByUserId(userId.toString(), requestId).catch((error) => {
      const message = `BatchDelete: Error - Failed to delete search index for User ID: ${userId} (requestId='${requestId}')`;
      Sentry.addBreadcrumb({ message });
      Sentry.captureException(error);
      console.log(message);
      console.log(error);
    });

    return res.send({
      status: 'OK',
      message: `BatchDelete: Deleting search index for User ID: ${userId} (requestId='${requestId}')`,
    });
  },
);
