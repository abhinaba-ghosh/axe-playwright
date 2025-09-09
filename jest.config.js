module.exports = {
  preset: 'jest-playwright-preset',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.(test|spec).(js|ts)'],
  testPathIgnorePatterns: ['/node_modules/', 'a11y.spec.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}