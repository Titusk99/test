module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test_unitaire/setup.js'],
  testMatch: ['<rootDir>/test_unitaire/**/*.test.js'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/routes/**/*.js',
    '!**/node_modules/**',
  ],
};
