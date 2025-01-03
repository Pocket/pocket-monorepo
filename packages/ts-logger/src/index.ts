export * from './logger.ts';
export * from './morgan.ts';

import { Logger, createLogger } from './logger.ts';
export const serverLogger: Logger = createLogger();
