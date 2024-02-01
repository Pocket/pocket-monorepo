module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  testTimeout: 500000,
  setupFilesAfterEnv: ['jest-extended/all'],
};
