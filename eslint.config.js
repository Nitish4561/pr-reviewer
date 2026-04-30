const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const globals = require("globals");

module.exports = [
  js.configs.recommended,

  // All JS/TS files: set globals and block console statements
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
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
  },

  // TypeScript files: add TS parser and plugin
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "no-console": "error",
    },
  },

  // Ignore build artifacts and config files
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".vercel/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
];
