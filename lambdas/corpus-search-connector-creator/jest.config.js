module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  setupFiles: ['./jest.setup.js'],
  displayName: 'corpus-parser-hyration-lambda',
};
