import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: [
    '<rootDir>/test/q21.test.ts',
    '<rootDir>/test/judge.test.ts',
    '<rootDir>/test/customCriteria.test.ts',
    '<rootDir>/test/evaluateCriteriaPartial.test.ts',
    '<rootDir>/test/health.test.ts',
    '<rootDir>/test/consultant.test.ts',
    '<rootDir>/test/lead.test.ts',
    '<rootDir>/test/journalist.test.ts',
    '<rootDir>/test/templates-endpoint.test.ts',
  ],
};

export default createJestConfig(config);

