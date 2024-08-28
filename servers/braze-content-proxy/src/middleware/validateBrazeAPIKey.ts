import { NextFunction, Request, Response } from 'express';
import { validateApiKey } from '../utils';

/**
 * Validates if the API key in the request is valid and the user is authorized to make a request
 */
export function validateBrazeApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Get the API key
  const apiKey = req.query.apikey as string;
  try {
    validateApiKey(apiKey);
    next();
  } catch (err) {
    next(err);
  }
}
