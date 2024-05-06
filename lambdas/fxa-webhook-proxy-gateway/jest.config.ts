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
  displayName: 'fxa-webhook-proxy-gateway',
  transformIgnorePatterns: [
    'node_modules/(?!(.*(nanoid|nanostores|node-fetch))/)',
  ],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};

export default jestConfig;
