// Our cursors for pagination require the server and code run in a single timezone.
// Sets the timezone for date objects in tests to be the same as the database timezone.
// This is the mimic application timezone set in the Dockerfile.
// IMPORTANT: Always keep this timezone the same as the application timezone
process.env.TZ = 'US/Central';

import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  displayName: 'list-api',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  setupFilesAfterEnv: ['jest-extended/all'],
  setupFiles: ['./jest.setup.ts'],
};

export default jestConfig;
