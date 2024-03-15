//Our cursors for pagination require the server and code run in a single timezone.
process.env.TZ = 'UTC';
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).[jt]s?(x)'],
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/dist/'],
};
