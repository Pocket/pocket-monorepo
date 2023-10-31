//Create a shared memcached to use within Parser
import Keyv from 'keyv';
import KeyvMemcache from '@keyv/memcache';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import config from './config';
import { serverLogger } from './server/express';

const memcache = new KeyvMemcache(config.memcached.servers);
const keyv = new Keyv({ store: memcache });
export const cache = new KeyvAdapter(keyv);

keyv.on('error', function (message) {
  serverLogger.error({
    message: 'keyv.on: Memcached cache error.',
    data: message,
  });
});
