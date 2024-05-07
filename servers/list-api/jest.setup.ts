// Our cursors for pagination require the server and code run in a single timezone.
// Sets the timezone for date objects in tests to be the same as the database timezone.
// This is the mimic application timezone set in the Dockerfile.
// IMPORTANT: Always keep this timezone the same as the application timezone
process.env.TZ = 'US/Central';
process.env.AWS_ACCESS_KEY_ID = 'fake-id';
process.env.AWS_SECRET_ACCESS_KEY = 'fake-key';
process.env.AWS_DEFAULT_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';
process.env.EVENT_BUS_NAME = 'default';
process.env.MAX_TRX_SIZE = '2';
