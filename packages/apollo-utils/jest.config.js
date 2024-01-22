module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['jest-extended/all'],
};
