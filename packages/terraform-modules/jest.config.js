module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  clearMocks: true,
  restoreMocks: true,
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['./setup.js'],
};
