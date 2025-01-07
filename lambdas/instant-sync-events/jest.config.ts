import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  displayName: 'instant-sync-events',
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: {
    "^(\\.\\/.+)\\.js$": "$1",
    "^(\\..\\/.+)\\.js$": "$1"
  },
};

export default config;