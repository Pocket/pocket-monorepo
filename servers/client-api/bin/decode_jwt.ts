#!npx ts-node
import * as readline from 'readline';
import {
  getSigningKeysFromServer,
  PocketUser,
  validateAndGetPocketUser,
} from '../src/jwtUtils';

const args = process.argv.slice(2);

let arg;
while ((arg = args.shift()) !== undefined) {
  switch (arg) {
    case '-h': // intentional fallthrough
    case '--help':
      usage();
      break;
    default:
      // any unhandled argument is assumed to be the jwt
      decodeJwt(arg).then(() => process.exit(0));
      break;
  }
}

// if we didn't get the jwt on the command line, get it from STDIN

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (input) => {
  rl.close();
  decodeJwt(input);
});

/**
 * Decode, validate, and print the jwt contents to STDOUT
 * @param input
 */
async function decodeJwt(input: string) {
  const keys: Record<string, string> = await getSigningKeysFromServer();
  // console.log('got signing keys');
  const user: PocketUser = await validateAndGetPocketUser(input.trim(), keys);
  console.log(user);
}

/**
 * Print usage doc
 */
function usage() {
  console.log(`

Decode and verify a Pocket JWT token. Use this to eye check JWT content.
ts_node decode_jwt [-h] encodedjwtcontext

You can also pipe a jwt into this command via STDIN.

`);
  process.exit(0);
}
