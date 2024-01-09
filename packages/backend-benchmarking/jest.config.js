module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(jest|spec).[jt]s?(x)'],
    testPathIgnorePatterns: ['/dist/'],
};
