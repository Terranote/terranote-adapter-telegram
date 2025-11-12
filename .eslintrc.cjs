module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  extends: ['standard-with-typescript'],
  rules: {
    'n/no-missing-import': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
}
module.exports = {
  root: true,
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  extends: [
    'standard-with-typescript'
  ],
  plugins: [],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off'
  },
  ignorePatterns: [
    'dist',
    'node_modules'
  ]
}

