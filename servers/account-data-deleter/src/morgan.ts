// to be made into a package for easier sharing shortly
import Logger from './logger';
import morgan, { StreamOptions } from 'morgan';

const stream: StreamOptions = {
  write: (message) => Logger.http(message),
};

// if userid header used, inject it into HTTP request logs
morgan.token('req-userid', function (req, _res) {
  const userid: string | string[] = req.headers.userid || null;
  if (userid === null) {
    return null;
  }
  return userid.toString();
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
  });
}

const morganMiddleware = morgan(jsonFormat, {
  stream: stream,
});

export default morganMiddleware;
