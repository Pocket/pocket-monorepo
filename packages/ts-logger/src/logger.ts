import {
  format as winstonFormat,
  transports as winstonTransports,
  createLogger as winstonCreateLogger,
} from 'winston';

import type { Logger, LoggerOptions } from 'winston';
export type { Logger, LoggerOptions };

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3, // optional level for http req & resp logging
  graphql: 4, // optional level for graphql req & resp logging
  debug: 5,
};

const env = process.env.NODE_ENV || 'development';
const isDevelopment = env === 'development';
const isLocal = env === 'local';
const isTest = env === 'test';
const envDefaultLogLevel = () => {
  // by default, dev & local envs run at debug, prod runs at info
  return isDevelopment || isLocal ? 'debug' : 'info';
};

const format = winstonFormat.combine(
  winstonFormat.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winstonFormat.json(),
);

// write logs to file, for local development
// Set to a function because when its not the code is executed,
// and tries making a logs directory even if its not used
const fileLoggingTransports = () => {
  return [
    new winstonTransports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winstonTransports.File({ filename: 'logs/all.log' }),
  ];
};

const transports = [
  // for local and test envs, log to files
  // otherwise, log to the console
  ...(isLocal || isTest
    ? fileLoggingTransports()
    : [new winstonTransports.Console()]),
];

/**
 * Create a winston.Logger intance with environment defaults.
 * @deprecated use createLogger instead.
 * @param metadata default meta data to be added to all logging messages.
 * @returns winston.Logger
 */
export function setLogger(metadata: object = {}): Logger {
  return createLogger({ defaultMeta: metadata });
}

/**
 * Create a winston.Logger intance with environment defaults.
 * @param options winston.LoggerOptions
 * @returns winston.Logger
 */
export function createLogger(options: LoggerOptions | undefined = {}): Logger {
  const defaults = {
    level: process.env['LOG_LEVEL'] || envDefaultLogLevel(),
    levels,
    format,
    transports,
  };

  const enchancedDefaultMeta = {
    releaseSha: process.env.RELEASE_SHA || null,
    ...options.defaultMeta,
  };

  const baseLogger = winstonCreateLogger({
    ...defaults,
    ...options,
    defaultMeta: enchancedDefaultMeta,
  });

  return baseLogger;
}
