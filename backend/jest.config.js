/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    // Mock the logger to suppress winston JSON output during tests
    '^@/utils/logger$': '<rootDir>/src/test-utils/logger.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
