import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: "^_"
            }],
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            "@typescript-eslint/no-unused-expressions": 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn'
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            ...prettierConfig.rules,
            'prettier/prettier': 'off',
        },
    },
    {
        ignores: ['**/dist'],
    },
    {
        languageOptions: {
            globals: {
                node: true,
                jest: true,
            },
        },
    },
];
