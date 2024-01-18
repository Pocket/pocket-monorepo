module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  displayName: 'account-delete-monitor',
  setupFiles: ['./jest.setup.js'],
};
