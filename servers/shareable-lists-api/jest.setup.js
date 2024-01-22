/**
 * Setup to allow tests to run outside docker compose.
 *
 * dotenv will not modify pre-existing environment variables,
 * so this does nothing when running in containers.
 */

// override service hostnames with localhost
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://root:@localhost:3306/shareablelists';
process.env.AWS_S3_ENDPOINT =
  process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
require('dotenv').config({ path: '.docker/local.env' });
