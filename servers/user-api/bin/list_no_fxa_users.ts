#!/usr/bin/env npx ts-node

import { Knex } from 'knex';
import { readClient } from '../src/database/client';
import { exit } from 'process';
import { Writable } from 'stream';
import * as fs from 'fs';

/**
 * Generate a report of non-FxA users
 * See the usage() function for more details
 */

interface NonFxaUserReportParams {
  queryLimit: number;
  queryOffset: number;
  client: Knex;
  outputStream: Writable;
  maxResults: number;
  supplementalFields: string[];
  outputFilename: string | null;
}

interface PerformanceTimings {
  startTime: number;
  queryCount: number;
  averageQueryTime: number;
  elapsedTime: number;
}

const params: NonFxaUserReportParams = {
  client: readClient(),
  outputStream: process.stdout,
  queryLimit: 1000,
  queryOffset: 0,
  maxResults: 1000,
  supplementalFields: ['users.email', 'users.birth'],
  outputFilename: null,
};

params.toString = function () {
  return `
    maxResults: ${this.maxResults},
    outputFilename: ${this.outputFilename},
    queryLimit: ${this.queryLimit}, 
    queryOffset: ${this.queryOffset}, 
    supplementalFields: ${this.supplementalFields.join(', ')}`;
};

const args = process.argv.slice(2);

let dry_run = false;

let arg: string | number | undefined;
while ((arg = args.shift()) !== undefined) {
  switch (arg) {
    case '-a': // intentional fallthrough
    case '--all':
      params.maxResults = Number.MAX_SAFE_INTEGER;
      break;
    case '-d': // intentional fallthrough
    case '--dry-run':
      dry_run = true;
      break;
    case '-f': // intentional fallthrough
    case '--file':
      arg = args.shift() ?? '';
      params.outputFilename = arg;
      params.outputStream = fs.createWriteStream(arg);
      break;
    case '-h': // intentional fallthrough
    case '--help':
      usage();
      break;
    case '-l': // intentional fallthrough
    case '--limit':
      arg = parseInt(args.shift() ?? '');
      if (!isNaN(arg)) {
        params.queryLimit = arg;
      }
      break;
    case '-m': // intentional fallthrough
    case '--max':
      arg = parseInt(args.shift() ?? '');
      if (!isNaN(arg)) {
        params.maxResults = arg;
      }
      break;
    case '-o': // intentional fallthrough
    case '--offset':
      arg = parseInt(args.shift() ?? '');
      if (!isNaN(arg)) {
        params.queryOffset = arg;
      }
      break;
    case '-s': // intentional fallthrough
    case '--supplemental':
      arg = args.shift() ?? '';
      params.supplementalFields = arg.split(',').map((s) => s.trim());
      break;
    case '-S': // intentional fallthrough
    case '--no-supplemental':
      params.supplementalFields = [];
      break;
    default:
      break;
  }
}

params.queryLimit = Math.min(params.queryLimit, params.maxResults);
if (params.outputFilename) {
  params.outputStream.on('error', (error) => {
    console.error(`Error writing to file: ${params.outputFilename}`, error);
    params.outputStream.end();
    exit(1);
  });
}

if (dry_run) {
  console.log('Parameters:', String(params));
  exit(0);
}

getAll(params)
  .then(([total, timings]) => {
    console.log(
      `\nFound ${total} non-FxA users as of ${new Date(
        timings.startTime,
      ).toLocaleString()}`,
    );
    console.log(
      `Ran ${timings.queryCount} queries in ${timings.elapsedTime}ms (${timings.averageQueryTime}ms/query)`,
    );
    console.log('Parameters:', String(params));
  })
  .catch((error) => {
    console.error('Error:', error);
    exit(1);
  })
  .finally(() => {
    params.client.destroy();
    if (params.outputFilename) {
      params.outputStream.end();
    }
  });

/**
 * Query and generate the report of non-FxA users
 * @param originalParams The parameters for the query and report stream
 * @returns The total number of rows in the report
 * @throws An error if the query fails
 */
async function getAll(
  originalParams: NonFxaUserReportParams,
): Promise<[number, PerformanceTimings]> {
  let total = 0;
  let count = 0;
  const perfTimings: PerformanceTimings = {
    startTime: Date.now(),
    queryCount: 0,
    averageQueryTime: 0,
    elapsedTime: 0,
  };
  const params = { ...originalParams };
  const fields = ['users.user_id', ...params.supplementalFields];
  params.outputStream.write(fields.join(',') + '\n');
  do {
    count = await getBatch(params);
    perfTimings.queryCount++;
    perfTimings.elapsedTime = Date.now() - perfTimings.startTime;
    total += count;
    params.queryOffset += count;
  } while (count === params.queryLimit && total < params.maxResults);
  perfTimings.averageQueryTime =
    perfTimings.elapsedTime / perfTimings.queryCount;
  return [total, perfTimings];
}

/**
 * Get a batch of non-FxA pocket users
 *
 * @param params The parameters for the query and report stream
 * @returns The number of rows in the batch
 */
async function getBatch(params: NonFxaUserReportParams): Promise<number> {
  const dbStream = params.client
    .select('users.user_id', ...params.supplementalFields)
    .from('users')
    .leftJoin(
      'user_firefox_account',
      'users.user_id',
      'user_firefox_account.user_id',
    )
    .whereNull('user_firefox_account.user_id')
    .orderBy('users.user_id', 'desc')
    .limit(params.queryLimit)
    .offset(params.queryOffset)
    .stream();

  let count = 0;
  for await (const row of dbStream) {
    count++;
    params.outputStream.write(
      Object.values(row)
        .map((v) => {
          if (v instanceof Date) {
            return v.toISOString();
          }
          return v;
        })
        .join(',') + '\n',
    );
  }
  return count;
}

/**
 * Print usage doc
 */
function usage() {
  console.log(`
  
Find out which Pocket users don't have an FxA account.
  
ts-node list_no_fxa_users.ts

Results are returned in CSV format sorted by user_id, descending. By default, the 
report includes the user_id, email, and birth date. You can add additional fields 
with the -s option.

For the database connection the following environment variables are consumed:

DATABASE_READ_HOST
DATABASE_READ_PASSWORD
DATABASE_READ_PORT
DATABASE_READ_USER

The right DATABASE_READ_HOST if you are running this with the intent of checking prod data is:

pocket-db-primary-0-prod-cluster.cluster-ro-cnjorcjciimm.us-east-1.rds.amazonaws.com

This is also probably the same host you're using when you work with the databse locally, so 
also use those credentials (and port 3306) here.

Options:
--------
-a, --all: List all records, (sets the max to Number.MAX_SAFE_INTEGER)
-d, --dry-run: Don't actually run the query, just print the parameters
-f, --file: Write the results to a file instead of stdout
-h, --help: Print this help message
-l, --limit: The number of rows to fetch per SQL query (default: 1000)
-m, --max: The maximum number of rows to fetch (default: 1000)
-o, --offset: The offset to start fetching rows at (default: 0)
-s, --supplemental: A comma-separated list of supplemental fields to fetch
-S, --no-supplemental: Don't fetch any supplemental fields, just the user_id
  `);
  process.exit(0);
}

/**
 * Here is the basic query for this
 * use `readitla_ril-tmp`;
 * select u.*
 * from users u
 * left join user_firefox_account f on u.user_id = f.user_id
 * where f.user_id IS null
 * order by u.user_id desc
 * limit 20
 * offset 1000
 */
