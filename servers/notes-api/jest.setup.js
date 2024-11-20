process.env.AWS_ACCESS_KEY_ID = 'fake-id';
process.env.AWS_SECRET_ACCESS_KEY = 'fake-key';
process.env.AWS_DEFAULT_REGION = 'us-east-1';

process.env.DATABASE_URL =
  'postgresql://pocket:password@localhost:5432/pocketnotes';
process.env.DATABASE_NAME = 'pocketnotes';
process.env.DATABASE_USER = 'pkt_notes';
process.env.DATABASE_PASSWORD = 'password';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
