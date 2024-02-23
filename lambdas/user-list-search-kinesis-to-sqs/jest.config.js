module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  displayName: 'user-list-search-kinesis-to-sqs-lambda',
  setupFilesAfterEnv: ['jest-extended/all'],
};
