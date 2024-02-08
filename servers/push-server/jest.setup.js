// AWS_ENDPOINT is set in .docker/local.env
process.env.AWS_ENDPOINT = process.env.AWS_ENDPOINT || 'http://localhost:4566';
process.env.TZ = 'US/Central';
process.env.AWS_ACCESS_KEY_ID = 'fake-id';
process.env.AWS_SECRET_ACCESS_KEY = 'fake-key';
process.env.AWS_DEFAULT_REGION = 'us-east-1';
