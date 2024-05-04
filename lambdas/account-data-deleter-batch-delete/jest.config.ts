import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  setupFiles: ['./jest.setup.ts'],
  displayName: 'lambda-batchdelete',
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};

export default jestConfig;
