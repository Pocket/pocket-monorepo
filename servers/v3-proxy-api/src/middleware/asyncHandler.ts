import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrap async middleware to call next(err) if the promise is rejected.
 * Prior to express 5, errors returned from asynchronous functions
 * invoked by route handler and middleware must be passed directly
 * to the next function.
 * @param fn the request handler middleware
 * @returns wrapped middleware function with promise handling
 */
export const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
