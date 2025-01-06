import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  setupFilesAfterEnv: ['jest-extended/all'],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
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
  }
};

export default config;