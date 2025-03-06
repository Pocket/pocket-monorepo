/**
 * Setup to allow tests to run outside docker compose.
 *
 * dotenv will not modify pre-existing environment variables,
 * so this does nothing when running in containers.
 */

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://root:@localhost:3306/shareablelists';
process.env.AWS_S3_ENDPOINT =
  process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
process.env.APOLLO_GRAPH_REF = '';

process.env.AWS_ACCESS_KEY_ID = 'fake-id';
process.env.AWS_SECRET_ACCESS_KEY = 'fake-key';
process.env.AWS_DEFAULT_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';
