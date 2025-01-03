import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  setupFiles: ['./jest.setup.ts'],
  displayName: 'corpus-parser-hyration-lambda',
  moduleNameMapper: {
    "^(\\.\\/.+)\\.js$": "$1",
    "^(\\..\\/.+)\\.js$": "$1"
  },
};

export default config;