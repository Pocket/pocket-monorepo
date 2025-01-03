import type { Config } from 'jest';

const config: Config = {
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
  setupFilesAfterEnv: ['./jest.setup.ts'],
  workerIdleMemoryLimit: 0.5,
};

export default config;