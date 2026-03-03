module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks',
    'plugin:react-refresh',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    tsx: true,
    experimentalObjectRestSpread: true,
    experimentalAsyncFunctions: true,
    decorators: true,
      noPrivate: false,
    privateInObject: true,
      optionalChaining: true,
    classProperties: false,
      classPrivateMethods: false,
      classPrivateFields: false,
      dynamicClassProperties: false,
    },
  },
  plugins: [
    'react-hooks',
    'react-refresh',
  ],
  settings: {
    'react/jsx': 'preserve',
  },
  rules: {
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'off',
  },
};
