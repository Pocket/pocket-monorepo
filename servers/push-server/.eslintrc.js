module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {},
  },
  rules: {
    "no-unneeded-ternary": "warn",
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single"],
    "semi": ["error", "never"],
    "no-unused-vars": [
      "warn",
      {
        "vars": "all",
        "args": "after-used",
      },
    ],
  },
}
