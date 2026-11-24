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
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/operator-linebreak': ['error', 'after'],
      '@stylistic/max-len': ['warn', 120],
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
      '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 4 }],
      '@stylistic/no-confusing-arrow': ['error', { allowParens: true, onlyOneSimpleParam: false }],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-mixed-operators': ['error', {
        groups: [
          ['%', '**'],
          ['%', '+'],
          ['%', '-'],
          ['%', '*'],
          ['%', '/'],
          ['/', '*'],
          ['&', '|', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!=='],
          ['&&', '||']
        ],
        allowSamePrecedence: false
      }],
      '@stylistic/nonblock-statement-body-position': ['error', 'beside'],
      '@stylistic/object-curly-newline': ['error', {
        ObjectExpression: { minProperties: 4, multiline: true, consistent: true },
        ObjectPattern: { minProperties: 4, multiline: true, consistent: true },
        ImportDeclaration: { minProperties: 4, multiline: true, consistent: true },
        ExportDeclaration: { minProperties: 4, multiline: true, consistent: true }
      }],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      '@stylistic/one-var-declaration-per-line': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi-style': ['error', 'last'],
      '@stylistic/spaced-comment': ['error', 'always', {
        line: { exceptions: ['-', '+'], markers: ['=', '!', '/'] },
        block: { exceptions: ['-', '+'], markers: ['=', '!', ':', '::'], balanced: true }
      }],
      '@stylistic/switch-colon-spacing': ['error', { after: true, before: false }],
      '@stylistic/wrap-iife': ['error', 'outside', { functionPrototypeMethods: false }]
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    rules: {
      'array-callback-return': ['error', { allowImplicit: true }],
      'arrow-body-style': ['error', 'as-needed'],
      camelcase: ['error', { properties: 'never' }],
      'class-methods-use-this': 'error',
      'consistent-return': 'error',
      curly: ['error', 'multi-line'],
      'default-case': ['error', { commentPattern: '^no default$' }],
      'default-case-last': 'error',
      'default-param-last': 'error',
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'grouped-accessor-pairs': 'error',
      'max-classes-per-file': ['error', 1],
      'new-cap': ['error', { newIsCap: true, capIsNew: false }],
      'no-alert': 'warn',
      'no-array-constructor': 'error',
      'no-await-in-loop': 'error',
      'no-bitwise': 'error',
      'no-cond-assign': ['error', 'always'],
      'no-console': 'warn',
      'no-constant-condition': ['error', { checkLoops: 'all' }],
      'no-constructor-return': 'error',
      'no-continue': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implied-eval': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-loop-func': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-nested-ternary': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-object-constructor': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      'no-promise-executor-return': 'error',
      'no-restricted-exports': ['error', { restrictedNamedExports: ['default', 'then'] }],
      'no-restricted-globals': [
        'error',
        { name: 'isFinite', message: 'Use Number.isFinite instead.' },
        { name: 'isNaN', message: 'Use Number.isNaN instead.' },
        'addEventListener', 'blur', 'close', 'closed', 'confirm', 'defaultStatus', 'defaultstatus', 'event',
        'external', 'find', 'focus', 'frameElement', 'frames', 'history', 'innerHeight', 'innerWidth', 'length',
        'location', 'locationbar', 'menubar', 'moveBy', 'moveTo', 'name', 'onblur', 'onerror', 'onfocus', 'onload',
        'onresize', 'onunload', 'open', 'opener', 'opera', 'outerHeight', 'outerWidth', 'pageXOffset', 'pageYOffset',
        'parent', 'print', 'removeEventListener', 'resizeBy', 'resizeTo', 'screen', 'screenLeft', 'screenTop',
        'screenX', 'screenY', 'scroll', 'scrollbars', 'scrollBy', 'scrollTo', 'scrollX', 'scrollY', 'self', 'status',
        'statusbar', 'stop', 'toolbar', 'top'
      ],
      'no-restricted-syntax': ['error', {
        selector: 'ForInStatement',
        message: 'for..in iterates over the prototype chain. ' +
          'Use Object.{keys,values,entries} and iterate over the resulting array.'
      }],
      'no-return-assign': ['error', 'always'],
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-shadow': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-underscore-dangle': ['error', { allowAfterThis: true }],
      'no-unneeded-ternary': ['error', { defaultAssignment: false }],
      'no-unreachable-loop': 'error',
      'no-unsafe-optional-chaining': ['error', { disallowArithmeticOperators: true }],
      'no-unused-expressions': 'error',
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      'no-use-before-define': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'no-void': ['error', { allowAsStatement: true }],
      'object-shorthand': ['error', 'always', { avoidQuotes: true }],
      'one-var': ['error', 'never'],
      'operator-assignment': ['error', 'always'],
      'prefer-arrow-callback': 'error',
      'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
      'prefer-exponentiation-operator': 'error',
      'prefer-numeric-literals': 'error',
      'prefer-object-spread': 'error',
      'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      radix: 'error',
      'symbol-description': 'error',
      'unicode-bom': ['error', 'never'],
      'valid-typeof': ['error', { requireStringLiterals: true }],
      yoda: 'error'
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
      '@typescript-eslint/no-inferrable-types': 'off',
      '@stylistic/function-call-argument-newline': 'off',
      '@stylistic/function-paren-newline': 'off',
      camelcase: 'off',
      'class-methods-use-this': 'off',
      '@typescript-eslint/class-methods-use-this': ['error', {
        ignoreClassesThatImplementAnInterface: true,
        ignoreOverrideMethods: true
      }],
      'default-case': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { requireDefaultForNonUnion: true }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] }
      ],
      'default-param-last': 'off',
      '@typescript-eslint/default-param-last': 'error',
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': 'error',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      'no-use-before-define': 'off',
      'object-shorthand': 'off',
      'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
      '@typescript-eslint/return-await': ['error', 'in-try-catch']
    }
  },
  {
    files: ['**/*.spec.ts', 'frontend/src/app/test-controller/test/**/*.ts'],
    rules: {
      '@typescript-eslint/class-methods-use-this': 'off'
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
