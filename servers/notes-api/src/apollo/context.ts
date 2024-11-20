import { Request } from 'express';

import {
  PocketContext,
  PocketContextManager,
} from '@pocket-tools/apollo-utils';

/**
 * Context factory function. Creates a new context upon
 * every request
 * @param req server request
 * @returns ContextManager
 */
export async function getContext({
  req,
}: {
  req: Request;
}): Promise<ContextManager> {
  return new ContextManager({
    request: req,
  });
}

export interface IContext extends PocketContext {}

export class ContextManager extends PocketContextManager implements IContext {
  constructor(options: { request: Request }) {
    super(options.request.headers);
  }
}
