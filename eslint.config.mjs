import { fileURLToPath } from 'node:url';
import { defineConfig, globalIgnores, includeIgnoreFile } from 'eslint/config';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import cypress from 'eslint-plugin-cypress';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const stylisticPreset = stylistic.configs.customize({
  indent: 2,
  quotes: 'single',
  semi: true,
  commaDangle: 'never',
  braceStyle: '1tbs',
  quoteProps: 'as-needed',
  jsx: false
});
const [, , presetIndentOptions] = stylisticPreset.rules['@stylistic/indent'];

export default defineConfig([
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  globalIgnores(['frontend/src/web-animations.min.js']),
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    extends: [js.configs.recommended]
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    extends: [stylisticPreset],
    rules: {
      '@stylistic/indent': ['error', 2, {
        ...presetIndentOptions,
        offsetTernaryExpressions: false,
        CallExpression: { arguments: 'first' },
        FunctionDeclaration: { ...presetIndentOptions.FunctionDeclaration, parameters: 'first' },
        FunctionExpression: { ...presetIndentOptions.FunctionExpression, parameters: 'first' }
      }],
      '@stylistic/operator-linebreak': ['error', 'after'],
      '@stylistic/max-len': ['warn', 120]
    }
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: [
          'frontend/tsconfig.json',
          'broadcaster/tsconfig.json',
          'broadcaster/tsconfig.spec.json',
          'common/tsconfig.json',
          'e2e/tsconfig.json'
        ],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off'
    }
  },
  {
    files: ['frontend/src/**/*.{js,ts}'],
    languageOptions: { globals: globals.browser }
  },
  {
    files: ['broadcaster/src/**/*.ts'],
    languageOptions: { globals: globals.node }
  },
  {
    files: ['e2e/src/**/*.ts'],
    extends: [cypress.configs.recommended],
    languageOptions: { globals: globals.mocha }
  },
  {
    files: [
      'scripts/**/*.js',
      'test/**/*.js',
      'e2e/*.js',
      'e2e/src/plugins/**/*.js',
      'frontend/src/karma.conf.js'
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  },
  {
    files: ['*.mjs', 'docs/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node }
  }
]);
