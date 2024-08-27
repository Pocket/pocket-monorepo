module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/?(*.)+(spec|integration).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/', '/lambda/'],
  testTimeout: 10000,
  displayName: 'braze-content-proxy',
  setupFilesAfterEnv: ['jest-extended/all'],
};
