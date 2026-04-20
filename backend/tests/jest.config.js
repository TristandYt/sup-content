/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    clearMocks: true,
    verbose: true,
    // On lui donne le chemin exact vers le fichier setup depuis la racine
    setupFiles: ['<rootDir>/backend/tests/jest.setup.js'], 
    testTimeout: 10000
};