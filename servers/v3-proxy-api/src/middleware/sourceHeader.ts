import { NextFunction, Request, Response } from 'express';

/**
 * Adds an expected x-source header set to Pocket to all responses
 * This is used by legacy pocket clients as an extra validation check that the response is from Pocket.
 * FROM v3 spec documentation: This header should be set to `Pocket`. This can be helpful to double check the 200 response isn't from a walled-garden network that intercepted the request. If this isn't set, then the response didn't come from Pocket. This is **not** meant for security as it could easily be faked, this is just a convenience you can choose to use or not.
 */
export function sourceHeaderHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.setHeader('X-Source', 'Pocket');
  next();
}
