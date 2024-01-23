export * from './logger';
export * from './morgan';

import { Logger, createLogger } from './logger';
export const serverLogger: Logger = createLogger();
