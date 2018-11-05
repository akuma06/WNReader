module.exports = {
  root: true,
  parser: 'typescript-eslint-parser',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  globals: {
    __static: true
  },
  plugins: [
    'html',
    'typescript'
  ],
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-array-constructor': 'off', // in favor of TypeScript rule
    'no-undef': 'off', // TypeScript has this functionality by default
    'no-unused-vars': 'off', // TypeScript has `noUnusedLocals` and `noUnusedParameters`
    'no-useless-constructor': 'warn',
    'space-infix-ops': 'warn', // https://github.com/nzakas/eslint-plugin-typescript/issues/85
    'typescript/adjacent-overload-signatures': 'error',
    'typescript/explicit-function-return-type': 'off',
    'typescript/explicit-member-accessibility': 'error',
    'typescript/member-delimiter-style': ['error', { delimiter: 'none' }],
    'typescript/no-angle-bracket-type-assertion': 'error',
    'typescript/no-array-constructor': 'error',
    'typescript/no-empty-interface': 'off',
    'typescript/no-namespace': 'error',
    'typescript/no-non-null-assertion': 'warn',
    'typescript/no-triple-slash-reference': 'error',
    'typescript/no-unused-vars': 'error',
    'typescript/no-use-before-define': ['error', { functions: false, classes: false, variables: false, typedefs: false }],
    'typescript/no-var-requires': 'error',
    'typescript/type-annotation-spacing': 'error'
  }
}
