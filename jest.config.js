module.exports = {
  preset: 'jest-playwright-preset',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}
