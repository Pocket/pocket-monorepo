module.exports = {
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  clearMocks: true,
  restoreMocks: true,
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['./setup.js'],
  workerIdleMemoryLimit: 0.5,
};
