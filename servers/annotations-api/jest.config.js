module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/', '/lambda/'],
  setupFiles: ['./jest.setup.js'],
  displayName: 'annotations-api',
  setupFilesAfterEnv: ['jest-extended/all'],
};
