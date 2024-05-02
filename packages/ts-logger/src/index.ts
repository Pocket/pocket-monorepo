export * from './logger.js';
export * from './morgan.js';

import { Logger, createLogger } from './logger.js';
export const serverLogger: Logger = createLogger();
