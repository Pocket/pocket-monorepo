module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec).[jt]s?(x)'],
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/dist/'],
};
