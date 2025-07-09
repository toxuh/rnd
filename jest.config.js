module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  roots: ['<rootDir>/core', '<rootDir>/app', '<rootDir>/hooks', '<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'core/**/*.ts',
    'app/api/**/*.ts',
    'hooks/**/*.ts',
    'lib/**/*.ts',
    '!core/**/*.d.ts',
    '!app/api/**/*.d.ts',
    '!hooks/**/*.d.ts',
    '!lib/**/*.d.ts',
    '!core/**/__tests__/**',
    '!app/api/**/__tests__/**',
    '!hooks/**/__tests__/**',
    '!lib/**/__tests__/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
