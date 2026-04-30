/**
 * Minimal ESLint config used only by the pre-commit hook (lint-staged).
 * Checks solely for console statements — does not run any other rules.
 */
const tsparser = require("@typescript-eslint/parser");
const globals = require("globals");

const sharedConfig = {
    ignores: [
      "node_modules/**",
      ".next/**",
      "*.config.js",
      "*.config.ts",
    ],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.es2021,
    },
  },
  rules: {
    "no-console": "error",
  },
};

module.exports = [
  // JS/JSX files
  {
    ...sharedConfig,
    files: ["**/*.{js,jsx}"],
  },
  // TS/TSX files — needs the TypeScript parser
  {
    ...sharedConfig,
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ...sharedConfig.languageOptions,
      parser: tsparser,
    },
  },
];
