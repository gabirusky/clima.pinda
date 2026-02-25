import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const globals = {
    window: 'readonly',
    document: 'readonly',
    console: 'readonly',
    fetch: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',
    setTimeout: 'readonly',
    clearTimeout: 'readonly',
    setInterval: 'readonly',
    clearInterval: 'readonly',
    ResizeObserver: 'readonly',
    IntersectionObserver: 'readonly',
    MutationObserver: 'readonly',
    navigator: 'readonly',
    URL: 'readonly',
    performance: 'readonly',
    HTMLElement: 'readonly',
    SVGElement: 'readonly',
    Event: 'readonly',
    KeyboardEvent: 'readonly',
    MouseEvent: 'readonly',
};

const testGlobals = {
    ...globals,
    // Jest globals
    describe: 'readonly',
    it: 'readonly',
    test: 'readonly',
    expect: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    jest: 'readonly',
};

export default [
    // Base JS config
    js.configs.recommended,

    // ── TypeScript source files ──────────────────────────────────────────
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: ['src/__mocks__/**'],
        plugins: {
            '@typescript-eslint': tsPlugin,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            // React 18 — no need to import React
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off', // TypeScript handles prop types
            // Downgrade some noisy TS rules for this codebase
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
            'no-undef': 'off',       // TypeScript handles this
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },

    // ── Test files ───────────────────────────────────────────────────────
    {
        files: ['src/__tests__/**/*.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
        plugins: {
            '@typescript-eslint': tsPlugin,
            react: reactPlugin,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: testGlobals,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-unused-vars': 'off',
            'no-undef': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
        },
    },

    // ── Ignore patterns ──────────────────────────────────────────────────
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            'src/__mocks__/**',        // CJS mock files — excluded from lint
            'vite.config.ts',          // Vite config is handled by tsconfig.node
            'jest.config.ts',
        ],
    },
];
