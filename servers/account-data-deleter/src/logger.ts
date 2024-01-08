// to be made into a package for easier sharing shortly
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  graphql: 4,
  debug: 5,
};

const env = process.env.NODE_ENV || 'development';
const isDevelopment = env === 'development';
const isLocal = env === 'local';
const level = () => {
  // dev & local environments run at debug, prod runs at info
  return isDevelopment || isLocal ? 'debug' : 'info';
};

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json(),
);

const fileLoggingTransports = [
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

const transports = [
  new winston.transports.Console(),
  ...(isLocal ? fileLoggingTransports : []),
];

const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default Logger;
