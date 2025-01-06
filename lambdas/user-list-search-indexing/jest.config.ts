import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  setupFilesAfterEnv: ['jest-extended/all'],
  moduleNameMapper: {
    "^(\\.\\/.+)\\.js$": "$1",
    "^(\\..\\/.+)\\.js$": "$1"
  },
};

export default config;