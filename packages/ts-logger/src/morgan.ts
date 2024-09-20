import type { Logger } from 'winston';
import { createLogger } from './logger';
import morgan, { token } from 'morgan';
import type { StreamOptions } from 'morgan';

// preferably pass through Logger with more context
// to setMorgan function below.
const defaultLogger: Logger = createLogger();

// if userid header used, inject it into HTTP request logs
token('req-userid', function (req, _res) {
  const userid: string | string[] | null = req.headers.userid || null;
  if (userid == null) {
    return undefined;
  }
  return userid.toString();
});

// if graph requestId header used, inject it into HTTP request logs
token('req-requestId', function (req, _res) {
  const requestId: string | string[] | null =
    req.headers['x-graph-request-id'] || null;
  if (requestId == null) {
    return undefined;
  }
  return requestId.toString();
});

// if traceId header used, inject it into HTTP request logs
token('req-traceId', function (req, _res) {
  const traceId: string | string[] | null = req.headers['x-amzn-trace'] || null;
  if (traceId == null) {
    return undefined;
  }
  return traceId.toString();
});

// default tokens (https://expressjs.com/en/resources/middleware/morgan.html)
// with any of our token additions (generally pulled from headers now) at the end
function jsonFormat(tokens, req, res) {
  return JSON.stringify({
    'remote-address': tokens['remote-addr'](req, res),
    'remote-user': tokens['remote-user'](req, res),
    time: tokens['date'](req, res, 'iso'),
    method: tokens['method'](req, res),
    url: tokens['url'](req, res),
    'http-version': tokens['http-version'](req, res),
    'status-code': tokens['status'](req, res),
    'content-length': tokens['res'](req, res, 'content-length'),
    referrer: tokens['referrer'](req, res),
    'user-agent': tokens['user-agent'](req, res),
    'response-time': tokens['response-time'](req, res),
    'total-time': tokens['total-time'](req, res),
    'req-userid': tokens['req-userid'](req, res),
    'req-requestId': tokens['req-requestId'](req, res),
    'req-traceId': tokens['req-traceId'](req, res),
  });
}

export function setMorgan(logger: Logger = defaultLogger): any {
  const stream: StreamOptions = {
    write: (message) => logger.http(message),
  };

  const morganMiddleware = morgan(jsonFormat, {
    stream: stream,
  });

  return morganMiddleware;
}
