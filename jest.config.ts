/** @type {import('jest').Config} */
export default {
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            useESM: true,
            tsconfig: {
                jsx: 'react-jsx',
            },
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Stub CSS and static assets
        '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
        '\\.(png|jpg|svg|gif)$': '<rootDir>/src/__mocks__/fileMock.js',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
    ],
    collectCoverageFrom: [
        'src/utils/**/*.ts',
        'src/hooks/**/*.ts',
        'src/components/**/*.tsx',
        '!src/**/*.d.ts',
    ],
    coverageReporters: ['text', 'lcov'],
};
