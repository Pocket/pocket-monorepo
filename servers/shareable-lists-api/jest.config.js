module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  setupFiles: ['./jest.setup.js'],
  displayName: 'shareable-lists-api',
  setupFilesAfterEnv: ['jest-extended/all'],
};
