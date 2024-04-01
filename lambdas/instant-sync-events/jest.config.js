module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  displayName: 'instant-sync-events',
  setupFiles: ['./jest.setup.js'],
};
