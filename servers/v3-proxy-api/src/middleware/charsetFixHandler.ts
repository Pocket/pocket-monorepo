import { NextFunction, Request, Response } from 'express';
import { parse } from 'content-type';
/**
 * The old v3 endpoiont allowed the use of invalid charset values in the content-type header. Specifically utf8 instead of utf-8,
 * this middleware allows the use of utf8 and converts it to utf8 rewriting it to utf-8, to support 3rd party apis.
 * This is specifically for Kobo until their client is updated.
 */
export function charsetFixHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const contentType = parse(req);
    if (contentType.parameters.charset.toLowerCase() === 'utf8') {
      req.headers['content-type'] = `${contentType.type}; charset=utf-8`;
    }
  } catch {
    // do nothing because there is no content-type header
  }
  next();
}
