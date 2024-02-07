module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/?(*.)+(spec|integration|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  testTimeout: 10000,
  displayName: 'push-server',
};