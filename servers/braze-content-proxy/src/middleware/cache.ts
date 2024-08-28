import { NextFunction, Request, Response } from 'express';
import config from '../config';

/**
 * Enable two minute cache when in AWS.
 * The short-lived cache is to speed up the curators' workflow
 * if they need to make last-minute updates.
 */
export function cache(req: Request, res: Response, next: NextFunction) {
  if (config.app.environment !== 'development') {
    res.set('Cache-control', 'public, max-age=120');
  }
}
