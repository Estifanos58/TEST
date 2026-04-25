module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/jest.early.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js','jsx','json','node'],
  testMatch: ['**/tests/**/?(*.)+(spec|test).[jt]s?(x)']
};
