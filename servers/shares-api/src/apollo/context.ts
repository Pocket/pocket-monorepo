import { Request } from 'express';

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

export interface IContext {}

export class ContextManager implements IContext {
  constructor(options: { request: Request }) {}
}
