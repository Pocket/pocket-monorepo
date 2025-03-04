import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec|integration).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  setupFiles: ['./jest.setup.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    ['^.+.tsx?$']: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
};

export default config;
