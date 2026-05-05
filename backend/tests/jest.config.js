/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    clearMocks: true,
    verbose: true,

    setupFiles: ['<rootDir>/jest.setup.js'], 
    testTimeout: 10000
};
