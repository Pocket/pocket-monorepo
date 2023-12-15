import winston, { Logger, LoggerOptions } from 'winston';

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

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json(),
);

// write logs to file, for local development
const fileLoggingTransports = [
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

const transports = [
  // for local and test envs, log to files
  // otherwise, log to the console
  ...(isLocal || isTest
    ? fileLoggingTransports
    : [new winston.transports.Console()]),
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

  const baseLogger = winston.createLogger({
    ...defaults,
    ...options,
    defaultMeta: enchancedDefaultMeta,
  });

  return baseLogger;
}
