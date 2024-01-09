module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:node/recommended"],
  plugins: ["import"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "node/no-unsupported-features/es-syntax": [
      // Add the node/no-unsupported-features/es-syntax rule
      "error",
      { ignores: ["modules"] },
    ],
  },
  overrides: [
    {
      files: ["**/*.test.js"], // Add the pattern for test files
      env: {
        jest: true, // Add the jest environment for test files
      },
    },
  ],
};
