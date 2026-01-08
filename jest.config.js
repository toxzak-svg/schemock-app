module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  testTimeout: 10000,
  moduleNameMapper: {
    '^chokidar$': '<rootDir>/__mocks__/chokidar.ts'
  },
  // Detect open handles to identify what's preventing Jest from exiting
  detectOpenHandles: true,
  // Force Jest to exit after all tests complete
  forceExit: true
};
